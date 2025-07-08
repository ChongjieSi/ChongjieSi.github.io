---
title: 代数不等式4：三角变换
summary: 走进不等式的世界
date: 2024-10-16
type: docs
math: true
tags:
  - 数学漫谈
image:
  caption: 
---

三角变换是指把一些变量等价代换为三角函数的形式。

## 例1

{{< math >}} $a,b,c\in \mathbb{R}$ {{< /math >}}，求证：{{< math >}} $\Pi_{cyc}(a^2+2) \geq 9 \sum_{cyc}ab$ {{< /math >}}

证明：

令{{< math >}} $a=\sqrt{2}\tan A$ {{< /math >}}，{{< math >}} $b=\sqrt{2}\tan B$ {{< /math >}}，{{< math >}} $c=\sqrt{2}\tan C$ {{< /math >}}，其中{{< math >}} $A,B,C \in(0,\frac{\pi}{2})$ {{< /math >}}，即需证

{{< math >}} $$\frac{4}{9}\geq (\Pi_{cyc}\cos A)  (\sum_{cyc} \cos A \sin B \sin C) \\ =\cos A\cos B\cos C(\cos A\cos B\cos C-\cos(A+B+C)) $$ {{< /math >}}

令{{< math >}} $\theta = \frac{A+B+C}{3}$ {{< /math >}}，则

{{< math >}} $$\cos A\cos B\cos C \leq (\frac{\cos A+\cos B +\cos C}{3})^3 \leq \cos^3\theta $$ {{< /math >}}

即证{{< math >}} $\frac{4}{9} \geq \cos^3\theta(\cos^3\theta-\cos3\theta)$ {{< /math >}}。又因{{< math >}} $\cos 3\theta = 4\cos ^3\theta -3 \cos\theta$ {{< /math >}}，即证{{< math >}} $\frac{4}{27} \geq \cos^3\theta(\cos\theta-\cos^3\theta)$ {{< /math >}}。又

{{< math >}}
$$
\begin{aligned}
  &\cos^3\theta(\cos\theta-\cos^3\theta) \\&= \cos^4\theta - \cos^6\theta \\ &=4 \frac{\cos^2\theta}{2} \frac{\cos^2\theta}{2} (1-\cos^2\theta) \\ &\leq \frac{4}{27}(\frac{\cos^2\theta}{2}+\frac{\cos^2\theta}{2}+1-\cos^2\theta)^3 \\ &=\frac{4}{27} 
\end{aligned}
$$
{{< /math >}}

证毕。

## 例2

{{< math >}} $a,b,c\in \mathbb{R}^{+}$ {{< /math >}}，且{{< math >}} $a+b+c=abc$ {{< /math >}}。求证：{{< math >}} $\sum_{cyc}\frac{1}{\sqrt{1+a^2}} \leq \frac{3}{2}$ {{< /math >}}

证明：

令{{< math >}} $a=\tan A$ {{< /math >}}，{{< math >}} $b=\tan B$ {{< /math >}}，{{< math >}} $c=\tan C$ {{< /math >}}，其中{{< math >}} $A,B,C \in(0,\frac{\pi}{2})$ {{< /math >}}。由等式的性质可知{{< math >}} $A,B,C$ {{< /math >}}为三角形的内角。即需证：{{< math >}} $\sum_{cyc}\cos A \leq \frac{3}{2}$ {{< /math >}}。显然成立。