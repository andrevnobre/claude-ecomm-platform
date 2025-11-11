"""
Calculator module with basic arithmetic operations.

This module provides simple calculator functions for addition, subtraction,
multiplication, and division with proper error handling.
"""


def add(a, b):
    """
    Add two numbers together.

    Args:
        a: First number (int or float)
        b: Second number (int or float)

    Returns:
        The sum of a and b

    Examples:
        >>> add(2, 3)
        5
        >>> add(-1, 1)
        0
        >>> add(2.5, 3.5)
        6.0
    """
    return a + b


def subtract(a, b):
    """
    Subtract the second number from the first number.

    Args:
        a: First number (int or float)
        b: Second number (int or float)

    Returns:
        The difference of a minus b

    Examples:
        >>> subtract(5, 3)
        2
        >>> subtract(3, 5)
        -2
        >>> subtract(10.5, 2.5)
        8.0
    """
    return a - b


def multiply(a, b):
    """
    Multiply two numbers together.

    Args:
        a: First number (int or float)
        b: Second number (int or float)

    Returns:
        The product of a and b

    Examples:
        >>> multiply(2, 3)
        6
        >>> multiply(-2, 3)
        -6
        >>> multiply(2.5, 4)
        10.0
    """
    return a * b


def divide(a, b):
    """
    Divide the first number by the second number.

    Args:
        a: Numerator (int or float)
        b: Denominator (int or float)

    Returns:
        The quotient of a divided by b

    Raises:
        ZeroDivisionError: If b is zero

    Examples:
        >>> divide(6, 3)
        2.0
        >>> divide(5, 2)
        2.5
        >>> divide(10, 4)
        2.5
        >>> divide(1, 0)
        Traceback (most recent call last):
            ...
        ZeroDivisionError: Cannot divide by zero
    """
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b
