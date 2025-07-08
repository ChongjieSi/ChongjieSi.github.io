---
title: "Why Can Accurate Models Be Learned from Inaccurate Annotations?"
authors:
  - Admin
  - Yidan Cui
  - Fuchao Yang
  - Xiaokang Yang
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
publication_short: "arXiv"

abstract: Learning from inaccurate annotations has gained significant attention due to the high cost of precise labeling. However, despite the presence of erroneous labels, models trained on noisy data often retain the ability to make accurate predictions. This intriguing phenomenon raises a fundamental yet largely unexplored question why models can still extract correct label information from inaccurate annotations remains unexplored. In this paper, we conduct a comprehensive investigation into this issue. By analyzing weight matrices from both empirical and theoretical perspectives, we find that label inaccuracy primarily accumulates noise in lower singular components and subtly perturbs the principal subspace. Within a certain range, the principal subspaces of weights trained on inaccurate labels remain largely aligned with those learned from clean labels, preserving essential task-relevant information. We formally prove that the angles of principal subspaces exhibit minimal deviation under moderate label inaccuracy, explaining why models can still generalize effectively. Building on these insights, we propose LIP, a lightweight plug-in designed to help classifiers retain principal subspace information while mitigating noise induced by label inaccuracy. Extensive experiments on tasks with various inaccuracy conditions demonstrate that LIP consistently enhances the performance of existing algorithms. We hope our findings can offer valuable theoretical and practical insights to understand of model robustness under inaccurate supervision.

# Summary. An optional shortened abstract.
summary: Explore why models can learn from noisy data.

tags:
- Machine Learning

featured: true

links:
- name: Zhihu
  url: https://zhuanlan.zhihu.com/p/1916081425578455316
url_code: 'https://github.com/Chongjie-Si/LIP'
url_pdf: https://arxiv.org/abs/2505.16159



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
