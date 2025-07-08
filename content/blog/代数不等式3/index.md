---
title: 代数不等式3：算术平均-几何平均不等式
summary: 走进不等式的世界
date: 2024-10-15
type: docs
math: true
tags:
  - 数学漫谈
image:
  caption: 
---


<!-- {{< math >}} $$ {{< /math >}} -->

继续来看一个非常优美的不等式：{{< math >}} $\frac{1}{2}(a+b) \geq \sqrt{ab}$ {{< /math >}}，其中{{< math >}} $a,b$ {{< /math >}}是两个正实数。我们称{{< math >}} $\frac{1}{2}(a+b)$ {{< /math >}}为算术平均，而{{< math >}} $ \sqrt{ab}$ {{< /math >}}为几何平均。其实很容易理解，算术平均可以看作是矩形两条边长的均值，几何平均就是面积的根号。最早使用算术平均和几何平均概念的有可能是毕达哥拉斯学派。

我们把上式拓展成多个变量的形式：

{{< math >}} $$ \frac{\sum_{i=1}^n x_i}{n} \geq (\Pi_{i=1}^n x_i)^{\frac{1}{n}} $$ {{< /math >}}

这就是算术平均-几何平均不等式。算术平均-几何平均不等式可以由柯西不等式优雅的证明，我这里再提供一种其他的证明方式。

由柯西不等式，

{{< math >}} $$\frac{\sum_{i=1}^n x_i}{n} \geq (\frac{\sum_{i=1}^n\sqrt{ x_i}}{n})^2$$ {{< /math >}}

令

{{< math >}}
$$
\begin{aligned}
M_r(x) &= (\frac{1}{n}  \sum_{i=1}^n x_i^r)^{\frac{1}{r}} \\ &=\exp(\frac{1}{r}\ln (\frac{1}{n}  \sum_{i=1}^n x_i^r) )  \\ &=\exp( \frac{1}{r}\ln (1 + r  \sum_{i=1}^n \frac{\ln x_i}{n}+o(r^2)  ) )
\end{aligned}
$$
{{< /math >}}

{{< math >}} $r\rightarrow0$ {{< /math >}}时，{{< math >}} $M_r(x) \rightarrow \exp(\sum_{i=1}^n(\frac{\ln x_i}{n})) = \Pi_{i=1}^nx_i^{\frac{1}{n}}$ {{< /math >}}。所以

{{< math >}} $$\frac{\sum_{i=1}^n x_i}{n} =M_1 (x) \geq  M_{r\rightarrow0}(x) = (\Pi_{i=1}^n x_i)^{\frac{1}{n}} $$ {{< /math >}}
