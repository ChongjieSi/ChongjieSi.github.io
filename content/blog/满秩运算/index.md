---
title: 矩阵的秩：MA=BM，B、M满秩，A一定满秩吗？
summary: 秩的运算
date: 2024-10-12
type: docs
math: true
tags:
  - 数学漫谈
image:
  caption: 
---


<!-- {{< math >}} $$ {{< /math >}} -->

科研过程中遇到了一个如下的问题：

已知矩阵{{< math >}} $\mathbf{M}$ {{< /math >}}是{{< math >}} $m\times n$ {{< /math >}}的满秩矩阵（{{< math >}} $m > n$ {{< /math >}}），{{< math >}} $\mathbf{A}$ {{< /math >}}是{{< math >}} $n$ {{< /math >}}阶方阵，{{< math >}} $\mathbf{B}$ {{< /math >}}是{{< math >}} $m$ {{< /math >}}阶满秩方阵，且满足{{< math >}} $\mathbf{MA} = \mathbf{BM}$ {{< /math >}}，问：{{< math >}} $\mathbf{A}$ {{< /math >}}一定满秩吗？

答案：{{< math >}} $\mathbf{A}$ {{< /math >}} 一定满秩。

直观理解：矩阵{{< math >}} $\mathbf{BM}$ {{< /math >}}可以覆盖{{< math >}} $\mathbf{M}$ {{< /math >}}的像空间中的所有向量。由于{{< math >}} $\mathbf{MA}$ {{< /math >}}也必须能够映射到同样的{{< math >}} $n$ {{< /math >}}维子空间，这意味着{{< math >}} $\mathbf{A}$ {{< /math >}}必须在{{< math >}} $\mathbb{R}^n$ {{< /math >}}上保持该映射的完整性。如果{{< math >}} $\mathbf{A}$ {{< /math >}}不是满秩矩阵，那么它会降低{{< math >}} $\mathbb{R}^n$ {{< /math >}}上的维度，导致{{< math >}} $\mathbf{MA}$ {{< /math >}}的像空间的维数小于{{< math >}} $n$ {{< /math >}}，这与{{< math >}} $\mathbf{BM}$ {{< /math >}}的像空间（即 {{< math >}} $\mathbf{M}$ {{< /math >}}的像空间，维度为{{< math >}} $n$ {{< /math >}}）相矛盾。因此，{{< math >}} $\mathbf{A}$ {{< /math >}}必须是满秩的。

数学证明：

{{< math >}} $$ r(\mathbf{MA})=r(\mathbf{BM})=r(\mathbf{M})=n $$  {{< /math >}}

{{< math >}} $$ r(\mathbf{MA})\leq\min\{r(\mathbf{M}), r(\mathbf{A})\}=\min \{n,r(\mathbf{A})\} $$ {{< /math >}}

即 {{< math >}} $n\leq \min\{n,r(\mathbf{A})\}$ {{< /math >}}，{{< math >}} $\therefore r(\mathbf{A})=n$ {{< /math >}}。