"""
Simple calculator module with basic arithmetic operations.
"""


def add(a, b):
    """
    Add two numbers together.

    Args:
        a: The first number
        b: The second number

    Returns:
        The sum of a and b
    """
    return a + b


def subtract(a, b):
    """
    Subtract the second number from the first.

    Args:
        a: The first number
        b: The second number

    Returns:
        The difference of a and b (a - b)
    """
    return a - b


def multiply(a, b):
    """
    Multiply two numbers together.

    Args:
        a: The first number
        b: The second number

    Returns:
        The product of a and b
    """
    return a * b


def divide(a, b):
    """
    Divide the first number by the second.

    Args:
        a: The numerator
        b: The denominator

    Returns:
        The quotient of a and b (a / b)

    Raises:
        ValueError: If b is zero (division by zero)
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
