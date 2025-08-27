---
title: Muon：有望成为下一代Adam的优化器
summary: 优化器
date: 2025-08-21
type: docs
math: true
tags:
  - 论文相关
  - 优化器
image:
  caption: 
---


<!-- {{< math >}} $$ {{< /math >}} -->

放在开头：这篇文章会比较零碎，是由我之前做过的一次分享记录而成。我没有特意去梳理文章，直接把讲稿拿来主义，属于知识比较密集，需要读者自行整理。不过总的逻辑是顺的，可以放心阅读。

我会分两次分别讲清楚 1）什么是Muon优化器、他怎么做的、以及一些相关工作，2）我们对Muon的探索。本次是第一篇。

优化算法是现代深度学习的基石。它决定了训练过程的轨迹，并显著影响模型的收敛速度与泛化性能。随着模型规模扩展至数十亿甚至数万亿参数量级，优化器的性能需求也相应提升。诸如 AdaGrad、RMSProp、Adam 及其变体 AdamW 等自适应方法，已成为训练语言模型的事实标准，其优势在于稳健性高、超参数易于调节，并能在早期训练阶段实现快速收敛。

现有的方法基本上可以总结为以下三步：

1. 计算参数的梯度（向量化或者矩阵化）
2. 对梯度进行变换得到修正后的分量
3. 梯度回传

公式整理为：
1. {{< math >}} $\theta_t \rightarrow \partial L(\theta_t)$ {{< /math >}}
2. {{< math >}} $\partial L(\theta_t) \rightarrow h(\partial L(\theta_t))$ {{< /math >}}
3. {{< math >}} $\theta_{t+1} \rightarrow \theta_t - \eta h(\partial L(\theta_t))$ {{< /math >}}

所以重点在于如何设计 {{< math >}} $ h(\cdot)$ {{< /math >}} 。

在介绍Muon之前，我先来简单介绍两个经典的优化器，并且和Muon有很强的关系。

## Adam

Adam 是一种常用的自适应学习率优化算法，结合了 RMSProp 和带动量的 SGD 的优点，能够在各种神经网络训练任务中快速收敛。Adam 可以算是至今为止最成功的优化器之一了。

<img src="https://pic4.zhimg.com/v2-55ba65b8735195327e719dbe66395673_1440w.jpg">

动态学习率：在深度学习训练中，每个参数维度上的梯度大小和变化往往相差巨大，使用单一全局学习率容易导致部分参数更新过快而震荡，或更新过慢而难以收敛。Adam 通过同时跟踪梯度的一阶矩（即梯度的指数加权平均，用于捕捉梯度方向）和二阶矩（即梯度平方的指数加权平均，用于估计梯度幅度），为每个参数动态调整有效学习率，从而在抑制噪声、加速收敛和兼顾稳定性方面表现出色。
bias correction：由于初始时 {{< math >}} $ m_0$ {{< /math >}}  和 {{< math >}} $ v_0$ {{< /math >}}  均为零，这两项在训练早期会产生偏向零的现象，因此需要进行 correction：

<img src="https://pic2.zhimg.com/v2-49e120c384e8f4c62f1b7ef4082ce9d7_1440w.jpg">

为什么用梯度的平方作为二阶矩：牛顿法强调了在优化过程中考虑曲率信息的重要性，通常是通过计算 Hessian 的逆来获得更优的局部下降方向。虽然在大规模模型中直接计算或存储完整的 Hessian 不现实，但可以用 Fisher 信息矩阵（FIM）来进行近似。Adam 通过对梯度平方的指数滑动平均来估计这一信息，从而实现根据梯度方差动态调整步长。

## Shampoo

Shampoo 是由 Google 提出的一个高效二阶优化算法，其核心思想是在不显式计算和存储完整 Hessian 矩阵的情况下，利用梯度的二阶矩信息来为每个参数维度自适应地调整更新方向和步幅。据说Gemini就是用它训的。

<img src="https://pic1.zhimg.com/v2-df30bad3fbaf2078820f83c25e00a9e6_1440w.jpg">

可以看到，Shampoo 是利用了 Fisher 矩阵的行和列关系。

<img src="https://pic3.zhimg.com/v2-e91da82c25506cc6a4972831cc48b172_1440w.jpg">

## Muon 的背景与具体做法

随着现代大规模模型在参数维度和结构复杂性上的不断增长，其参数空间表现出越来越丰富的依赖关系与矩阵结构几何特性。这一趋势促使研究者越来越关注如何通过挖掘梯度中的全局结构，提升训练过程的条件数和效率。Muon 就是在这么样的背景下提出来的。

我们首先介绍一下 Muon 优化器，这是一种专门为二维参数结构设计的新型优化方法。

<img src="https://pic2.zhimg.com/v2-d4534064c5b6cb973fc105d36a3de817_1440w.jpg">

给定一个权重矩阵 {{< math >}} $ \mathbf{W}\in\mathbb{R}^{n\times m}$ {{< /math >}} ，以及当前迭代步{{< math >}} $ t$ {{< /math >}} 的梯度 {{< math >}} $\mathbf{G}_t$ {{< /math >}} ，Muon 首先会计算一个常规的动量缓冲项 {{< math >}} $ \mathbf{M}_t$ {{< /math >}} ：

{{< math >}} $$\mathbf{M}_t = \beta\mathbf{M}_{t-1} + \mathbf{G}_t$$ {{< /math >}}

其中 {{< math >}} $ \beta $ {{< /math >}} 是动量系数。不同于常规优化器直接使用动量或其自适应变种，Muon 对动量项进行了几何结构上的变换，从而生成更具结构性的更新方向。具体来说，它会提取动量矩阵的“正交部分”，即通过极分解计算出 {{< math >}} $ \mathbf{M}_t$ {{< /math >}}  的正交因子 {{< math >}} $ \mathbf{O}_t$ {{< /math >}} 。理论上，这个因子可以看作是对 {{< math >}} $ \mathbf{M}_t = \mathbf{U}\mathbf{\Sigma}\mathbf{V}^\mathsf{T}$ {{< /math >}}  进行奇异值分解后得到的 {{< math >}} $ \mathbf{U}\mathbf{V}^\mathsf{T}$ {{< /math >}}  。

考虑到完整 SVD 的计算代价较高，Muon 使用了一种更高效的替代方案：Newton–Schulz 迭代，来近似地求解这个正交因子：

{{< math >}} $$\mathbf{O}_t = \text{Newton–Schulz}(\mathbf{M}_t, T),$$ {{< /math >}}

最终，参数更新规则如下：

{{< math >}} $$\mathbf{W}_{t+1} = \mathbf{W}_t - \eta \mathbf{O}_t$$ {{< /math >}}

这种基于 Newton–Schulz 迭代的矩阵正交化方式，为参数更新带来了明确的结构和几何约束。相比传统的对角类自适应方法，它在高维参数空间中能更稳定地进行训练，并更高效地探索损失函数的形状。

牛顿迭代法的目的是逼近极分解。他的motivation是，对于一个需要分解的矩阵 {{< math >}} $ \mathbf{MG}$ {{< /math >}} ，我们可以通过矩阵乘法和加法，得到：

<img src="https://pic4.zhimg.com/v2-526b97c47874807497d5b3f529df5e65_1440w.jpg">

那接下来事情就简单多了，我只需要让中间关于S的多项式能够趋向于1就可以了。这就是牛顿迭代的思想，最终通过设计一个多项式，通过迭代多次，便可以将一个 [0，1] 之间的数映射到1或者接近1。

<img src="https://pic4.zhimg.com/v2-4391b062750278506b0a6d7af7c1aedd_1440w.jpg">

我个人的一个简单理解：有一个函数，对于一个非常小的数，我将其放大3倍（假如），并且让最大值不超过1。那么经历多次放大（迭代），我便可以将一个非常小的数放大到接近1了。

## 行业现状

Muon 还存在一些问题，针对这些问题，现有的工作提出了不同的技术方案。

### 训练稳定性与学习率的对齐问题

Muon 优化器存在以下两个问题：

1. Muon 训练的参数更新量的 RMS norm 不稳定。
2. Muon 在实际使用时是只作用在 2 维参数，1 维参数还是使用 AdamW。这表示需要用到额外一套学习率，增加调参的负担。

为了解决上述两个问题，Moonshot 提出以下解决策略：

1. 引入 weight decay，稳定更新量；

<img src="https://pic4.zhimg.com/v2-d5e316183cf1956571b2141e583731a9_1440w.jpg">

2. 对齐 Muon 和 Adam 更新量的 RMS norm，复用 Adam 学习率。
因此，最终Muon的形式为：

<img src="https://pic4.zhimg.com/v2-17591d000d8190773499169cc7691c2f_1440w.jpg">

### Attn logits 的爆炸问题

Moonshot 还在其实验中观测到 Muon 更容易产生大的 attn logits。

<img src="https://pic1.zhimg.com/v2-78bdeb19a135f8430096b5d266983022_1440w.jpg">

他们也对应的提出了 MuonClip，并用在 Kimi K2中：

<img src="https://pic1.zhimg.com/v2-d70653eb1f12eae5276502c0e2497aee_1440w.jpg">

## 实验

我们自己也做了一些实验，结论是：Muon 可以取得比Adam 25% 左右的training efficiency。

<img src="https://pic2.zhimg.com/v2-f8f64518094eab8ca49bdafa5fa48ff7_1440w.jpg">

在下一篇中，我将详细展示我们对Muon的探索。
