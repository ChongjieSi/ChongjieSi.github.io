---
title: "Revisiting Sparsity Constraint Under High-Rank Property in Partial Multi-Label Learning"
authors:
  - Admin
  - Yidan Cui
  - Fuchao Yang,
  - Xiaokang Yang
  - Wei Shen

date: "2025-05-27T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2025-05-27T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article"]

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "<b>Arxiv</b>"

abstract: Partial Multi-Label Learning (PML) extends the multi-label learning paradigm to scenarios where each sample is associated with a candidate label set containing both ground-truth labels and noisy labels. Existing PML methods commonly rely on two assumptions sparsity of the noise label matrix and low-rankness of the ground-truth label matrix. However, these assumptions are inherently conflicting and impractical for real-world scenarios, where the true label matrix is typically full-rank or close to full-rank. To address these limitations, we demonstrate that the sparsity constraint contributes to the high-rank property of the predicted label matrix. Based on this, we propose a novel method Schirn, which introduces a sparsity constraint on the noise label matrix while enforcing a high-rank property on the predicted label matrix. Extensive experiments demonstrate the superior performance of Schirn compared to state-of-the-art methods, validating its effectiveness in tackling real-world PML challenges.

# Summary. An optional shortened abstract.
summary: A PML method

tags:
- Machine Learning

featured: false

links:
url_pdf: https://arxiv.org/abs/2505.20938


# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: 'Experiment'
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
