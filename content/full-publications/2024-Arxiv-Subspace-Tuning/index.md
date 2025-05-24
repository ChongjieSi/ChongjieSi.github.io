---
title: "See Further for Parameter Efficient Fine-tuning by Standing on the Shoulders of Decomposition"
authors:
  - Admin
  - Xiaokang Yang
  - Wei Shen

date: "2024-07-07T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2024-07-07T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article"]

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "<b>Arxiv</b>"

abstract: The rapid expansion of large foundation models within the pre-training and fine-tuning framework has underscored that larger models often yield better results. However, the scaling up of large foundation models has led to soaring costs in fine-tuning and parameter storage, rendering extensive adaptations impractical. This challenge has sparked the development of parameter-efficient fine-tuning (PEFT), which focuses on optimizing a select subset of parameters while keeping the rest fixed, significantly lowering computational and storage overheads. While recent years have witnessed a significant success in PEFT, a deep understanding of the fundamental principles behind these methods remains unexplored. To this end, here we take the first step to unify all approaches by dissecting them from a decomposition perspective. We initiate a comprehensive mathematical analysis of these methods, allowing us to delve deeply into their underlying mechanisms, and we explore the reasons behind the variations in performance among different techniques. Furthermore, inspired by our theoretical analysis, we introduce two novel PEFT methods alongside a simple yet effective framework designed to enhance the performance of PEFT techniques across various applications. Our empirical validations, conducted across multiple datasets, demonstrate the efficacy of these methods, showcasing both theoretical validity and practical performance improvements under the guidance of our analytical findings. We believe our work will deepen researchers' understanding of PEFT and other techniques, prompting further contemplation and advancing the research across the whole community.

# Summary. An optional shortened abstract.
summary: A generalized framework for parameter efficient fine-tuning.

tags:
- Parameter Efficient Fine-tuning
- Machine Learning
- Natural Language Processing

featured: false

links:
- name: QbitAI
  url: https://mp.weixin.qq.com/s/J_e_7svrpDuxxefes-s7Xw
- name: MIT Technology
  url: https://www.mittrchina.com/news/detail/14173
- name: AIGC
  url: https://mp.weixin.qq.com/s/F49cI9NQmDWvH-Zm0AtI-w
url_pdf: https://arxiv.org/abs/2407.05417
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
