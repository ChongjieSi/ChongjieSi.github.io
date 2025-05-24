---
title: "Unveiling the Mystery of Weight in Large Foundation Models: Gaussian Distribution Never Fades"
authors:
  - Admin
  - Jingjing Jiang
  - Xiaokang Yang
  - Wei Shen

date: "2025-01-20T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2025-01-20T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article"]

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "<b>Arxiv</b>"

abstract: This paper presents a pioneering exploration of the mechanisms underlying large foundation models' (LFMs) weights, aiming to simplify AI research. Through extensive observation and analysis on prevailing LFMs, we find that regardless of initialization strategies, their weights predominantly follow a Gaussian distribution, with occasional sharp, inverted T-shaped, or linear patterns. We further discover that the weights share the i.i.d. properties of Gaussian noise, and explore their direct relationship. We find that transformation weights can be derived from Gaussian noise, and they primarily serve to increase the standard deviation of pre-trained weights, with their standard deviation growing with layer depth. In other words, transformation weights broaden the acceptable deviation from the optimal weights, facilitating adaptation to downstream tasks. Building upon the above conclusions, we thoroughly discussed the nature of optimal weights, ultimately concluding that they should exhibit zero-mean, symmetry, and sparsity, with the sparse values being a truncated Gaussian distribution and a few outliers. Our experiments in LFM adaptation and editing demonstrate the effectiveness of these insights. We hope these findings can provide a foundational understanding to pave the way for future advancements in the LFM community.

# Summary. An optional shortened abstract.
summary: Unveil the structure and behavior of weight in large foundation models.

tags:
- Machine Learning
- Natural Language Processing
- Computer Vision

featured: true

links:
url_pdf: https://arxiv.org/abs/2501.10661



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
