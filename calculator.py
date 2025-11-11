"""
A simple calculator module with basic arithmetic operations.

This module provides functions for addition, subtraction, multiplication,
and division with proper error handling.
"""


def add(a, b):
    """
    Add two numbers together.

    Args:
        a: The first number (int or float)
        b: The second number (int or float)

    Returns:
        The sum of a and b (int or float)

    Example:
        >>> add(2, 3)
        5
        >>> add(2.5, 3.5)
        6.0
    """
    return a + b


def subtract(a, b):
    """
    Subtract the second number from the first number.

    Args:
        a: The number to subtract from (int or float)
        b: The number to subtract (int or float)

    Returns:
        The difference of a and b (int or float)

    Example:
        >>> subtract(5, 3)
        2
        >>> subtract(10.5, 2.5)
        8.0
    """
    return a - b


def multiply(a, b):
    """
    Multiply two numbers together.

    Args:
        a: The first number (int or float)
        b: The second number (int or float)

    Returns:
        The product of a and b (int or float)

    Example:
        >>> multiply(3, 4)
        12
        >>> multiply(2.5, 4)
        10.0
    """
    return a * b


def divide(a, b):
    """
    Divide the first number by the second number.

    Args:
        a: The dividend (int or float)
        b: The divisor (int or float)

    Returns:
        The quotient of a divided by b (float)

    Raises:
        ZeroDivisionError: If b is zero

    Example:
        >>> divide(10, 2)
        5.0
        >>> divide(7, 2)
        3.5
        >>> divide(5, 0)
        Traceback (most recent call last):
            ...
        ZeroDivisionError: Cannot divide by zero
    """
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b
