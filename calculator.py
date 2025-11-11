"""
Simple calculator module with basic arithmetic operations.
"""


def add(a, b):
    """
    Add two numbers together.

    Args:
        a: First number
        b: Second number

    Returns:
        The sum of a and b
    """
    return a + b


def subtract(a, b):
    """
    Subtract the second number from the first number.

    Args:
        a: Number to subtract from
        b: Number to subtract

    Returns:
        The difference of a and b
    """
    return a - b


def multiply(a, b):
    """
    Multiply two numbers together.

    Args:
        a: First number
        b: Second number

    Returns:
        The product of a and b
    """
    return a * b


def divide(a, b):
    """
    Divide the first number by the second number.

    Args:
        a: Numerator
        b: Denominator

    Returns:
        The quotient of a divided by b

    Raises:
        ValueError: If b is zero (division by zero)
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
