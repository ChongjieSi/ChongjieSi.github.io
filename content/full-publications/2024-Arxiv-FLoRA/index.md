---
title: "FLoRA: Low-Rank Core Space for N-dimension"
authors:
  - Admin
  - Xuehui Wang
  - Xue Yang
  - Zhengqin Xu
  - Qingyun Li
  - Jifeng Dai
  - Yu Qiao
  - Xiaokang Yang
  - Wei Shen

date: "2024-05-23T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2024-05-23T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article"]

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "<b>Arxiv</b>"

abstract: Adapting pre-trained foundation models for various downstream tasks has been prevalent in artificial intelligence. Due to the vast number of tasks and high costs, adjusting all parameters becomes unfeasible. To mitigate this, several fine-tuning techniques have been developed to update the pre-trained model weights in a more resource-efficient manner, such as through low-rank adjustments. Yet, almost all of these methods focus on linear weights, neglecting the intricacies of parameter spaces in higher dimensions like 4D. Alternatively, some methods can be adapted for high-dimensional parameter space by compressing changes in the original space into two dimensions and then employing low-rank matrix decomposition. However, these approaches destructs the structural integrity of the involved high-dimensional spaces. To tackle the diversity of dimensional spaces across different foundation models and provide a more precise representation of the changes within these spaces, this paper introduces a generalized parameter-efficient fine-tuning framework, FLoRA, designed for various dimensional parameter space. Specifically, utilizing Tucker decomposition, FLoRA asserts that changes in each dimensional parameter space are based on a low-rank core space which maintains the consistent topological structure with the original space. It then models the changes through this core space alongside corresponding weights to reconstruct alterations in the original space. FLoRA effectively preserves the structural integrity of the change of original N-dimensional parameter space, meanwhile decomposes it via low-rank tensor decomposition. Extensive experiments on computer vision, natural language processing and multi-modal tasks validate FLoRA's effectiveness.

# Summary. An optional shortened abstract.
summary: A PEFT method aiming to preserve the topological structure of N-dimensional parameter space while seeking low-rank representations.

tags:
- Parameter Efficient Fine-tuning
- Computer Vision
- Natural Language Processing

featured: false

links:
- name: QbitAI
  url: https://mp.weixin.qq.com/s/x2NID0EsUiNLC5RJ01s-wg
- name: AIGC
  url: https://mp.weixin.qq.com/s/Pg8MevJN1DrVZvmbkNluFA
- name: Zhihu
  url: https://zhuanlan.zhihu.com/p/705909337
url_pdf: https://arxiv.org/abs/2405.14739
url_code: 'https://github.com/Chongjie-Si/Subspace-Tuning'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: 'Framework'
  focal_point: ""
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects:
- []

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
slides: ""
---
