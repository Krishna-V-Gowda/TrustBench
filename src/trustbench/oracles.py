from __future__ import annotations

import math
from collections import Counter
from collections.abc import Iterable, Sequence
from typing import Any

import numpy as np
from scipy import stats
from sklearn.decomposition import PCA


def linear_quantile(values: Sequence[float], q: float) -> float:
    return float(np.quantile(np.asarray(values, dtype=float), q, method="linear"))


def sample_std(values: Sequence[float]) -> float:
    array = np.asarray(values, dtype=float)
    if array.size < 2:
        return 0.0
    return float(np.std(array, ddof=1))


def fisher_pearson_skew(values: Sequence[float], *, bias: bool) -> float:
    result = stats.skew(np.asarray(values, dtype=float), bias=bias)
    return 0.0 if np.isnan(result) else float(result)


def pearson_pairwise(x: Sequence[Any], y: Sequence[Any]) -> float | None:
    pairs: list[tuple[float, float]] = []
    for left, right in zip(x, y, strict=True):
        try:
            if left in (None, "") or right in (None, ""):
                continue
            left_value = float(left)
            right_value = float(right)
        except (TypeError, ValueError):
            continue
        if math.isfinite(left_value) and math.isfinite(right_value):
            pairs.append((left_value, right_value))
    if len(pairs) < 3:
        return None
    left_values, right_values = zip(*pairs, strict=True)
    if np.std(left_values) == 0 or np.std(right_values) == 0:
        return None
    return float(np.corrcoef(left_values, right_values)[0, 1])


def contingency_table(a: Iterable[Any], b: Iterable[Any]) -> np.ndarray:
    pairs = [(str(left), str(right)) for left, right in zip(a, b, strict=True)]
    left_levels = list(dict.fromkeys(left for left, _ in pairs))
    right_levels = list(dict.fromkeys(right for _, right in pairs))
    table = np.zeros((len(left_levels), len(right_levels)), dtype=float)
    left_index = {value: index for index, value in enumerate(left_levels)}
    right_index = {value: index for index, value in enumerate(right_levels)}
    for left, right in pairs:
        table[left_index[left], right_index[right]] += 1
    return table


def cramers_v_raw(a: Sequence[Any], b: Sequence[Any]) -> float:
    table = contingency_table(a, b)
    n = float(table.sum())
    if n == 0 or min(table.shape) < 2:
        return 0.0
    chi2 = float(stats.chi2_contingency(table, correction=False)[0])
    denominator = n * min(table.shape[0] - 1, table.shape[1] - 1)
    return math.sqrt(chi2 / denominator) if denominator else 0.0


def cramers_v_bias_corrected(a: Sequence[Any], b: Sequence[Any]) -> float:
    table = contingency_table(a, b)
    n = float(table.sum())
    if n <= 1 or min(table.shape) < 2:
        return 0.0
    chi2 = float(stats.chi2_contingency(table, correction=False)[0])
    phi2 = chi2 / n
    rows, cols = table.shape
    phi2_corrected = max(0.0, phi2 - ((cols - 1) * (rows - 1)) / (n - 1))
    rows_corrected = rows - ((rows - 1) ** 2) / (n - 1)
    cols_corrected = cols - ((cols - 1) ** 2) / (n - 1)
    denominator = min(cols_corrected - 1, rows_corrected - 1)
    return math.sqrt(phi2_corrected / denominator) if denominator > 0 else 0.0


def eta_squared(numeric: Sequence[float], groups: Sequence[Any]) -> float:
    values = np.asarray(numeric, dtype=float)
    if values.size < 3:
        return 0.0
    overall = float(np.mean(values))
    grouped: dict[str, list[float]] = {}
    for value, group in zip(values, groups, strict=True):
        grouped.setdefault(str(group), []).append(float(value))
    between = sum(
        len(group_values) * (float(np.mean(group_values)) - overall) ** 2
        for group_values in grouped.values()
    )
    total = float(np.sum((values - overall) ** 2))
    return min(1.0, max(0.0, between / total if total else 0.0))


def pca_reference(
    data: Sequence[dict[str, Any]], columns: Sequence[str]
) -> dict[str, Any]:
    matrix = np.empty((len(data), len(columns)), dtype=float)
    for column_index, column in enumerate(columns):
        raw = np.asarray(
            [np.nan if row.get(column) in (None, "") else float(row[column]) for row in data],
            dtype=float,
        )
        mean = float(np.nanmean(raw))
        raw = np.where(np.isnan(raw), mean, raw)
        std = float(np.std(raw, ddof=1))
        matrix[:, column_index] = 0.0 if std == 0 else (raw - mean) / std
    model = PCA(n_components=min(2, matrix.shape[1]), svd_solver="full")
    scores = model.fit_transform(matrix)
    return {
        "explained_variance_ratio": model.explained_variance_ratio_.tolist(),
        "components": model.components_.tolist(),
        "scores": scores.tolist(),
    }


def duplicate_count(data: Sequence[dict[str, Any]], columns: Sequence[str]) -> int:
    keys = [tuple(row.get(column, "") for column in columns) for row in data]
    return sum(max(0, count - 1) for count in Counter(keys).values())
