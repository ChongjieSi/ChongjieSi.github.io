---
title: "Appeal: Allow Mislabeled Samples the Chance to be Rectified in Partial Label Learning"
authors:
  - Admin
  - Xuehui Wang
  - Yan Wang
  - Xiaokang Yang
  - Wei Shen

date: "2024-03-28T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2017-01-01T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: article

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "arXiv"

abstract: In partial label learning (PLL), each instance is associated with a set of candidate labels among which only one is ground-truth. The majority of the existing works focuses on constructing robust classifiers to estimate the labeling confidence of candidate labels in order to identify the correct one. However, these methods usually struggle to identify and rectify mislabeled samples. To help these mislabeled samples "appeal" for themselves and help existing PLL methods identify and rectify mislabeled samples, in this paper, we propose the first appeal-based PLL framework. Specifically, we introduce a novel partner classifier and instantiate it predicated on the implicit fact that non-candidate labels of a sample should not be assigned to it, which is inherently accurate and has not been fully investigated in PLL. Furthermore, a novel collaborative term is formulated to link the base classifier and the partner one. During each stage of mutual supervision, both classifiers will blur each other's predictions through a blurring mechanism to prevent overconfidence in a specific label. Extensive experiments demonstrate that the appeal and disambiguation ability of several well-established stand-alone and deep-learning based PLL approaches can be significantly improved by coupling with this learning paradigm.

# Summary. An optional shortened abstract.
summary: A novel strategy ''appeal'' of partial label learning.

tags:
- Partial Label Learning
- Machine Learning

featured: false

links:
url_pdf: https://arxiv.org/abs/2312.11034v3
url_code: 'https://github.com/SJTU-DeepVisionLab/PLCP'


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