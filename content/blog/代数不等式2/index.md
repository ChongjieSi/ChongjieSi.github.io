---
title: 代数不等式2：一些简单不等式的证明
summary: 走进不等式的世界
date: 2024-10-14
type: docs
math: true
tags:
  - 数学漫谈
image:
  caption: 
---


<!-- {{< math >}} $$ {{< /math >}} -->

## 例1

{{< math >}} $x,y,z\in \mathbb{R}^+$ {{< /math >}}，求证：{{< math >}} $(\sum_{cyc}xy)(\sum_{cyc} \frac{1}{(x+y)^2}) \ge \frac{9}{4}$ {{< /math >}}

证明：无脑展开，把分母项去掉。

{{< math >}}
$$
\begin{aligned}
& 4(\sum_{cyc}yz)(\sum_{cyc} {(x+y)^2(x+z) ^2}) -9\Pi_{cyc}(x+y)^2 \\ =& \sum_{cyc}yz(y-z)^2(4y^2+7yz+4z^2)+\frac{xyz}{x+y+z}\sum_{cyc}(y-z)^2(2yz+(y+z-x)^2) \\ \ge & 0

\end{aligned}
$$ {{< /math >}}

## 例2

{{< math >}} $x,y,z\in \mathbb{R}^+$ {{< /math >}}，且{{< math >}} $\sum_{cyc}xy =1 $ {{< /math >}}，求证：{{< math >}} $\sum_{cyc}\frac{1+x^2y^2}{(x+y)^2} \ge \frac{5}{2}$ {{< /math >}}

证明：无脑展开，配平.

{{< math >}}
$$
\begin{aligned}
& \sum_{cyc}\frac{1+x^2y^2}{(x+y)^2} - \frac{5}{2} \\ =& \frac{\Pi_{cyc}(x-y)^2}{2\Pi_{cyc}(x+y)^2} + \sum_{cyc}\frac{( x(y+z)(y^2+z^2-2x^2) +(y-z)^2(x^2+yz))^2 }{6\Pi_{cyc}(x+y)^2}\\ \ge & 0
\end{aligned}
$$
{{< /math >}}

## 例3

{{< math >}} $a,b,c,d\in \mathbb{R}^+$ {{< /math >}}，且{{< math >}} $\sum_{cyc}a =4 $ {{< /math >}}。求证：{{< math >}} $\sum_{cyc}a^2(b+c) + 8abcd \le 16$ {{< /math >}}

证明：
{{< math >}} $a^2(b+c)$ {{< /math >}}次数为3，{{< math >}} $abcd$ {{< /math >}}次数为4，先将次数配齐。考虑到

{{< math >}} $$(\sum_{cyc}a) (\sum_{cyc} bcd) \ge(4\sum_{cyc}\sqrt{abcd})^2=16abcd $$ {{< /math >}}

即{{< math >}} $ \sum_{cyc} bcd \ge4abcd $ {{< /math >}}。若能证明{{< math >}} $\sum_{cyc}a^2(b+c) +2\sum_{cyc}bcd \le 16$ {{< /math >}}，即可得证。因为

{{< math >}}
$$
\begin{aligned}
& \frac{(a+b+c+d)^2}{4} -\sum_{cyc}a^2(b+c) -2\sum_{cyc}bcd \\ = & \sum_{cyc}\frac{a}{4}(a-b-d+d)^2 \ge 0
\end{aligned}
$$
{{< /math >}}

证毕

在处理上述不等式时，还有一种最简单最暴力的算法，就是努力构造平方项。先构造以{{< math >}} $a $ {{< /math >}}为变量的平方项，不断的提取公因数不断的配平，再分别对其他变量构造平方项。这个方法可以应用在绝大部分例题中，不过缺点就是计算量大。我之前在处理不等式的问题中，如果走投无路，便会使用这一方法。
