---
title: 'Partial Label Learning with a Partner'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - Admin
  - Zekun Jiang
  - Xuehui Wang
  - Yan Wang
  - Xiaokang Yang
  - Wei Shen
# Author notes (optional)
author_notes:


date: '2024-03-24T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
publishDate: '2024-03-24T00:00:00Z'

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ['paper-conference']

# Publication name and optional abbreviated publication name.
publication: The 38th AAAI Conference on Artificial Intelligence
publication_short: <b>AAAI</b>, <font color="#FF79BC">**Oral**</font>

abstract: In partial label learning (PLL), each instance is associated with a set of candidate labels among which only one is ground-truth. The majority of the existing works focuses on constructing robust classifiers to estimate the labeling confidence of candidate labels in order to identify the correct one. However, these methods usually struggle to rectify mislabeled samples. To help existing PLL methods identify and rectify mislabeled samples, in this paper, we introduce a novel partner classifier and propose a novel ''mutual supervision'' paradigm. Specifically, we instantiate the partner classifier predicated on the implicit fact that non-candidate labels of a sample should not be assigned to it, which is inherently accurate and has not been fully investigated in PLL. Furthermore, a novel collaborative term is formulated to link the base classifier and the partner one. During each stage of mutual supervision, both classifiers will blur each other's predictions through a blurring mechanism to prevent overconfidence in a specific label. Extensive experiments demonstrate that the performance and disambiguation ability of several well-established stand-alone and deep-learning based PLL approaches can be significantly improved by coupling with this learning paradigm.

# Summary. An optional shortened abstract.
summary: A novel PLL framework based on a complementary classifier and a collaborative relationship.

tags:
  - Partial Label Learning
  - Machine Learning

# Display this page in the Featured widget?
featured: false

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: 'https://ojs.aaai.org/index.php/AAAI/article/view/29424'
url_code: 'https://github.com/SJTU-DeepVisionLab/PLCP'
url_poster: 'paper-poster/2024-AAAI-PLCP.pdf'
# url_video: 'https://dl.acm.org/doi/abs/10.1145/3580305.3599282'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
image:
  caption: 'Framework'
  focal_point: ''
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

