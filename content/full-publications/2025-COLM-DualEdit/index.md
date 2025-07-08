---
title: "DualEdit: Dual Editing for Knowledge Updating in Vision-Language Models"
authors:
  - Zhiyi Shi
  - Binjie Wang
  - Admin
  - Yichen Wu
  - Junsik Kim
  - Hanspeter Pfister

date: "2025-06-16T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2025-07-08T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: paper-conference

# Publication name and optional abbreviated publication name.
publication: "2025 CONFERENCE ON LANGUAGE MODELING"
publication_short: "<b>COLM</b>"

abstract: Model editing aims to efficiently update a pre-trained model's knowledge without the need for time-consuming full retraining. While existing pioneering editing methods achieve promising results, they primarily focus on editing single-modal language models (LLMs). However, for vision-language models (VLMs), which involve multiple modalities, the role and impact of each modality on editing performance remain largely unexplored. To address this gap, we explore the impact of textual and visual modalities on model editing and find that (1) textual and visual representations reach peak sensitivity at different layers, reflecting their varying importance; and (2) editing both modalities can efficiently update knowledge, but this comes at the cost of compromising the model's original capabilities. Based on our findings, we propose DualEdit, an editor that modifies both textual and visual modalities at their respective key layers. Additionally, we introduce a gating module within the more sensitive textual modality, allowing DualEdit to efficiently update new knowledge while preserving the model's original information. We evaluate DualEdit across multiple VLM backbones and benchmark datasets, demonstrating its superiority over state-of-the-art VLM editing baselines as well as adapted LLM editing methods on different evaluation metrics.

# Summary. An optional shortened abstract.
summary: DualEdit edits key textual and visual layers in VLMs with a text-gating module to inject new knowledge while preserving existing capabilities.

tags:
- Model Editing
- Multi-model Learning
- Natural Language Processing

featured: false

links:
url_pdf: https://arxiv.org/abs/2506.13638
# url_code: 'https://github.com/Chongjie-Si/Subspace-Tuning'

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
