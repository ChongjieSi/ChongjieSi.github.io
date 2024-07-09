---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% if site.author.googlescholar %}
  <div class="wordwrap">You can also find my articles on <a href="{{site.author.googlescholar}}">my Google Scholar profile</a>.<br> </div>
{% endif %}

{% include base_path %}

# **Preprints**

Arxiv. **Chongjie Si**, Xiaokang Yang, Wei Shen. <font color='Navy'>See Further for Parameter Efficient Fine-tuning by Standing on the Shoulders of Decomposition</font> ([PDF](https://arxiv.org/abs/2407.05417)).

Posted to 2024 NeurIPS. **Chongjie Si**, Xuehui Wang, Xue Yang, Zhengqin Xu, Qingyun Li, Jifeng Dai, Yu Qiao, Xiaokang Yang, Wei Shen.<font color='Navy'>FLoRA: Low-Rank Core Space for N-dimension</font>. ([PDF](https://arxiv.org/abs/2405.14739))

# **Journal**

2023 TKDE. **Chongjie Si**, Yuheng Jia, Ran Wang, Min-Ling Zhang, Yanghe Feng, Qu Chongxiao. <font color='Navy'>Multi-label Classification with High-rank and High-order Label Correlations</font> ([PDF](https://ieeexplore.ieee.org/abstract/document/10310153)).

# **Conference**

2024 ECCV. **Chongjie Si**, Xuehui Wang, Xiaokang Yang, Wei Shen. <font color='Navy'>Tendency-driven Mutual Exclusivity for Weakly Supervised Incremental Semantic Segmentation</font> ([PDF](https://arxiv.org/abs/2404.11981)).

2024 AAAI **<font color='#FF79BC'>oral</font>**. **Chongjie Si**, Zekun Jiang, Xuehui Wang, Yan Wang, Xiaokang Yang, Wei Shen. <font color='Navy'>Partial Label Learning with a Partner</font> ([PDF](https://ojs.aaai.org/index.php/AAAI/article/view/29424)).

2023 KDD **<font color='#FF79BC'>oral</font>**. Yuheng Jia<sup>*</sup>, **Chongjie Si<sup>*</sup>**, Min-Ling Zhang. <font color='Navy'>Complementary Classifier Induced Partial Label Learning</font> ([PDF](https://dl.acm.org/doi/abs/10.1145/3580305.3599282)).

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
