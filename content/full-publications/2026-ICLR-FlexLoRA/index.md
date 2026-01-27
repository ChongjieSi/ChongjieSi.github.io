---
title: "FlexLoRA: Entropy-Guided Flexible Low-Rank Adaptation"
authors:
  - Muqing Liu
  - Admin
  - Yuheng Jia

date: "2026-01-25T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2026-01-25T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: paper-conference

# Publication name and optional abbreviated publication name.
publication: "The Fourteenth International Conference on Learning Representations"
publication_short: "ICLR"

abstract: Large pre-trained models achieve remarkable success across diverse domains, yet fully fine-tuning incurs prohibitive computational and memory costs. Parameter-efficient fine-tuning (PEFT) has thus become a mainstream paradigm. Among them, Low-Rank Adaptation (LoRA) introduces trainable low-rank matrices and shows strong performance, nevertheless, its fixed-rank design limits flexibility. Dynamic rank allocation methods mitigate this issue by pruning redundant directions; however, they often rely on heuristic, element-level metrics that globally sort rank directions without matrix-wise distinction, and they lack mechanisms to expand capacity in layers requiring additional adaptation. To overcome these limitations, we propose FlexLoRA, an entropy-guided flexible low-rank adaptation framework that (i) evaluates matrix importance via spectral energy entropy, (ii) supports rank pruning and expansion under a global budget, and (iii) employs zero-impact initialization for newly added singular directions to ensure stability. By addressing granularity, flexibility, and stability limitations, FlexLoRA provides a more principled solution for PEFT. Extensive experiments show that FlexLoRA consistently outperforms state-of-the-art baselines across benchmarks.

# Summary. An optional shortened abstract.
summary: A PEFT article which dives into the flexible rank of LoRA.

tags:
- Parameter Efficient Fine-tuning
- Natural Language Processing
- Machine Learning

featured: false

links:
url_pdf: https://openreview.net/forum?id=tqnkbdYWWm
# url_code: 'https://github.com/Chongjie-Si/Subspace-Tuning'
# url_poster: 'paper-poster/2025-ICLR-LoRADash.pdf'



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
