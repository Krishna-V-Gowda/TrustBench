from __future__ import annotations

import math

from trustbench.oracles import (
    cramers_v_raw,
    eta_squared,
    linear_quantile,
    pearson_pairwise,
    sample_std,
)


def test_linear_quantile_and_sample_std() -> None:
    values = [1, 2, 3, 4, 20]
    assert linear_quantile(values, 0.25) == 2.0
    assert linear_quantile(values, 0.75) == 4.0
    assert math.isclose(sample_std(values), 7.905694150420948)


def test_pairwise_pearson_ignores_missing_pairs() -> None:
    result = pearson_pairwise([1, 2, "", 4, 5], [2, 4, 999, 8, 10])
    assert result is not None
    assert math.isclose(result, 1.0)


def test_eta_squared_is_label_rename_invariant() -> None:
    values = [1, 2, 8, 9, 10]
    first = eta_squared(values, ["A", "A", "B", "B", "B"])
    renamed = eta_squared(values, ["left", "left", "right", "right", "right"])
    assert math.isclose(first, renamed)
    assert math.isclose(first, 0.9642857142857143)


def test_raw_cramers_v_is_row_order_invariant() -> None:
    a = ["x", "x", "x", "y", "y", "y"]
    b = ["u", "u", "v", "v", "v", "u"]
    original = cramers_v_raw(a, b)
    reordered = cramers_v_raw(list(reversed(a)), list(reversed(b)))
    assert math.isclose(original, 1 / 3)
    assert math.isclose(original, reordered)
