---
title: "Co-Reinforcement Learning for Unified Multimodal Understanding and Generation"
authors:
  - Jingjing Jiang
  - Admin
  - Jun Luo
  - Hanwang Zhang
  - Chao Ma

date: "2025-09-18T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2025-09-18T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: paper-conference

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "NeurIPS"

abstract: Open-vocabulary semantic segmentation assigns every pixel a label drawn from an open-ended, text-defined space. Vision–language models such as CLIP excel at zero-shot recognition, yet their image-level pre-training hinders dense prediction. Current approaches either fine-tune CLIP—at high computational cost—or adopt training-free attention refinements that favor local smoothness while overlooking global semantics. In this paper, we present OPMapper, a lightweight, plug-and-play module that injects both local compactness and global connectivity into attention maps of CLIP. It combines Context-aware Attention Injection, which embeds spatial and semantic correlations, and Semantic Attention Alignment, which iteratively aligns the enriched weights with textual prompts. By jointly modeling token dependencies and leveraging textual guidance, OPMapper enhances visual understanding. OPMapper is highly flexible and can be seamlessly integrated into both training-based and training-free paradigms with minimal computational overhead. Extensive experiments demonstrate its effectiveness, yielding significant improvements across 8 open-vocabulary segmentation benchmarks.

# Summary. An optional shortened abstract.
summary: A co-reinforcement learning framework comprising a unified RL stage for joint optimization and a refined RL stage for task-specific enhancement. 

tags:
- Multi Modal

featured: false

# links:
url_pdf: https://arxiv.org/abs/2505.17534
url_code: https://github.com/mm-vl/ULM-R1


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
