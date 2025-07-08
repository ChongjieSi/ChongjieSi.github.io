---
title: 代数不等式1：柯西不等式与拉格朗日恒等式
summary: 走进不等式的世界
date: 2024-10-13
type: docs
math: true
tags:
  - 数学漫谈
image:
  caption: 
---


## 简介

<!-- {{< math >}} $$ {{< /math >}} -->
我准备开一个专栏，专门写一些不等式的内容，主要是我对一些不等式的理解。参考书籍：《代数不等式》。

首先定义轮换求和 {{< math >}} $\sum_{cyc}$ {{< /math >}} 与对称求和 {{< math >}} $\sum_{sym}$ {{< /math >}}：

若 {{< math >}} $x$ {{< /math >}} 是三个变量 {{< math >}} $x,y,z$ {{< /math >}}中的一个，定义
{{< math >}} $$\sum_{cyc}f(x,y,z) =f(x,y,z)+f(y,z,x)+f(z,x,y)$$ {{< /math >}}
{{< math >}} $$\sum_{sym}f(x,y,z) =f(x,y,z)+f(x,z,y)+f(y,x,z)+f(y,z,x)+f(z,x,y)+f(z,y,x)$$ {{< /math >}}

<hr>

柯西不等式可能是我使用最多的一个不等式。具体来说，对任意实数变量，有
{{< math >}} $$\sum_{i=1}^na_i^2\sum_{i=1}^nb_i^2\geq (\sum_{i=1}^na_ib_i)^2$$ {{< /math >}}
柯西不等式的证明：

{{< math >}}

$$
\begin{aligned}
&\sum_{i=1}^n a_i^2 \sum_{i=1}^n b_i^2
  - \bigl(\sum_{i=1}^n a_i b_i\bigr)^2 \\[6pt]
=& \sum_{i=1}^n\sum_{j=1}^n a_i^2 b_j^2
  - \sum_{i=1}^n\sum_{j=1}^n a_i b_i a_j b_j \\[6pt]
=& \tfrac12\sum_{i=1}^n\sum_{j=1}^n
   \bigl(a_i^2 b_j^2 + a_j^2 b_i^2 - 2a_i b_i a_j b_j\bigr) \\[6pt]
=& \tfrac12\sum_{i=1}^n\sum_{j=1}^n (a_i b_j - a_j b_i)^2 \\[6pt]
=& \sum_{1\le i< j\le n} (a_i b_j - a_j b_i)^2 \;\ge\;0
\end{aligned}

$$

{{< /math >}}
其中，
{{< math >}} $\sum_{i=1}^na_i^2\sum_{i=1}^nb_i^2 - (\sum_{i=1}^na_ib_i)^2  = \sum_{1\leq i \leq j \leq n} (a_ib_j-a_jb_i)^2 $ {{< /math >}}即为拉格朗日恒等式。

## 例1

已知 {{< math >}} $\{a,b,c,d\}$ {{< /math >}}，{{< math >}} $ \sum_{cyc}a^2=1$ {{< /math >}}，求证：
{{< math >}} $$(a+b)^4+(a+c)^4+(a+d)^4+(b+c)^4+(b+d)^4+(c+d)^4\leq 6$$ {{< /math >}}

思路：在处理不等式时，我会将两边的次数配平。上式左边为4次，右边为0次，先利用等式配齐，再进行处理。

证明：

需证明

{{< math >}} $$(a+b)^4+(a+c)^4+(a+d)^4+(b+c)^4+(b+d)^4+(c+d)^4 \leq 6$$ {{< /math >}}
{{< math >}} $$\Rightarrow (a+b)^4+(a+c)^4+(a+d)^4+(b+c)^4+(b+d)^4+(c+d)^4\leq 6(\sum_{cyc}a^2)^2 $$ {{< /math >}}
又
{{< math >}} $$6(\sum_{cyc}a^2)^2 = (a+b)^4+(a-b)^4+(a+c)^4+(a-c)^4+(a+d)^4+(a-d)^4\\+(b+c)^4+(b-c)^4+(b+d)^4+(b-d)^4+(c+d)^4+(c-d)^4 $$ {{< /math >}}

证毕。

## 例2

{{< math >}} $x,y,z\in\mathbb{R}^+$ {{< /math >}}，{{< math >}} $xyz(x+y+z)=1$ {{< /math >}}，求 {{< math >}} $(x+y)(x+z)$ {{< /math >}} 的最小值。

解：{{< math >}} $(x+y)(x+z)=x(x+y+z)+yz=yz+\frac{1}{yz}\geq 2$ {{< /math >}}

## 例3

证：{{< math >}} $(\sum_{i=1}^na_i)(\sum_{i=1}^nb_i )- \sum_{i=1}^na_ib_i \geq \sqrt{(\sum_{sym}a_ia_j )(\sum_{sym}b_ib_j))}$ {{< /math >}}

证明：
{{< math >}}
$$
\begin{aligned}
& \sum_{i=1}^na_ib_i  + \sqrt{(\sum_{sym}a_ia_j )(\sum_{sym}b_ib_j))} \\ \leq & \sqrt{(\sum_{i=1}^n a_i^2 +\sum_{sym}a_ia_j) (\sum_{i=1}^n b_i^2 +\sum_{sym}b_ib_j) } \\ \leq & (\sum_{i=1}^n a_i)(\sum_{i=1}^n b_i)
\end{aligned}
$$

{{< /math >}}
