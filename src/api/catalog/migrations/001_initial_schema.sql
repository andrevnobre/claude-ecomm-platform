-- Migration: 001_initial_schema
-- Description: Create initial catalog schema with categories and products tables
-- Created: 2025-11-12

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Create full-text search index for product search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for categories
INSERT INTO categories (name, slug, description) VALUES
    ('Electronics', 'electronics', 'Electronic devices and accessories'),
    ('Clothing', 'clothing', 'Apparel and fashion items'),
    ('Books', 'books', 'Physical and digital books'),
    ('Home & Garden', 'home-garden', 'Home improvement and garden supplies'),
    ('Sports', 'sports', 'Sports equipment and outdoor gear')
ON CONFLICT (slug) DO NOTHING;

-- Insert seed data for products
INSERT INTO products (name, description, price, sku, category_id, stock_quantity, is_active) VALUES
    (
        'Laptop Pro 15"',
        'High-performance laptop with 15-inch display, 16GB RAM, 512GB SSD',
        1299.99,
        'LAPTOP-PRO-15',
        (SELECT id FROM categories WHERE slug = 'electronics'),
        25,
        true
    ),
    (
        'Wireless Mouse',
        'Ergonomic wireless mouse with precision tracking',
        29.99,
        'MOUSE-WIRELESS-01',
        (SELECT id FROM categories WHERE slug = 'electronics'),
        150,
        true
    ),
    (
        'Cotton T-Shirt',
        'Comfortable 100% cotton t-shirt in various colors',
        19.99,
        'TSHIRT-COTTON-01',
        (SELECT id FROM categories WHERE slug = 'clothing'),
        200,
        true
    ),
    (
        'Programming Book: Clean Code',
        'Essential guide to writing clean and maintainable code',
        49.99,
        'BOOK-CLEANCODE',
        (SELECT id FROM categories WHERE slug = 'books'),
        50,
        true
    ),
    (
        'Garden Tool Set',
        'Complete 10-piece garden tool set with carrying bag',
        89.99,
        'GARDEN-TOOLSET-10',
        (SELECT id FROM categories WHERE slug = 'home-garden'),
        30,
        true
    )
ON CONFLICT (sku) DO NOTHING;

COMMENT ON TABLE categories IS 'Product categories with hierarchical support';
COMMENT ON TABLE products IS 'Product catalog with pricing and inventory';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.stock_quantity IS 'Available inventory quantity';
