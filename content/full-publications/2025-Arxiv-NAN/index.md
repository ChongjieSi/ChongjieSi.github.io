---
title: "NAN: A Training-Free Solution to Coefficient Estimation in Model Merging"
authors:
  - Admin
  - Kangtao Lv 
  - Jingjing Jiang
  - Yadao Wang 
  - Yongwei Wang
  - Xiaokang Yang
  - Wenbo Su
  - Bo Zheng
  - Wei Shen

date: "2025-05-22T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2025-05-22T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article"]

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "<b>Arxiv</b>"

abstract: Model merging offers a training-free alternative to multi-task learning by combining independently fine-tuned models into a unified one without access to raw data. However, existing approaches often rely on heuristics to determine the merging coefficients, limiting their scalability and generality. In this work, we revisit model merging through the lens of least-squares optimization and show that the optimal merging weights should scale with the amount of task-specific information encoded in each model. Based on this insight, we propose NAN, a simple yet effective method that estimates model merging coefficients via the inverse of parameter norm. NAN is training-free, plug-and-play, and applicable to a wide range of merging strategies. Extensive experiments on show that NAN consistently improves performance of baseline methods.

# Summary. An optional shortened abstract.
summary: Explore why models can learn from noisy data.

tags:
- Machine Learning
- Computer Vision
- Natural Language Processing

featured: false

links:
- name: Zhihu
  url: https://zhuanlan.zhihu.com/p/1916806999116612547
url_pdf: https://arxiv.org/abs/2505.16148



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
