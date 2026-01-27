---
title: 'Task-Specific Directions: Definition, Exploration, and Utilization in Parameter Efficient Fine-Tuning'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - Admin
  - Zhiyi Shi
  - Shifan Zhang
  - Xiaokang Yang
  - Hanspeter Pfister
  - Wei Shen

date: '2026-01-26T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
publishDate: '2026-01-26T00:00:00Z'

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: article-journal

# Publication name and optional abbreviated publication name.
publication: "IEEE Transactions on Pattern Analysis and Machine Learning"
publication_short: TPAMI

abstract: Large language models demonstrate impressive performance on downstream tasks, yet they require extensive resource consumption when fully fine-tuning all parameters. To mitigate this, Parameter Efficient Fine-Tuning (PEFT) strategies, such as LoRA, have been developed. In this paper, we delve into the concept of task-specific directions (TSDs), which are critical for transitioning large models from pretrained states to task-specific enhancements in PEFT. We propose a framework to clearly define these directions and explore their properties and practical utilization challenges. We then introduce a novel approach, LoRA-Dash, which aims to maximize the impact of TSDs during the fine-tuning process, thereby enhancing model performance on targeted tasks. Additionally, based on our exploration of TSD, we focus on an important issue in PEFT:the initialization of LoRA. While some works have pointed out the significance of initialization for LoRA's performance and proposed various strategies, these methods are often empirical and not task-specific. To address this issue, we propose LoRA-Init. Starting from TSD, we identify the directions that require the most adjustment during fine-tuning for downstream tasks. By initializing the matrices in LoRA with these directions, LoRA-Init significantly enhances LoRA's performance. Moreover, we can combine LoRA-Dash and LoRA-Init to create the final version of LoRA based on TSDs, which we refer to as LoRA-TSD. Extensive experiments have conclusively demonstrated the effectiveness of these methods, and in-depth analyses further reveal the underlying mechanisms behind their success.

# Summary. An optional shortened abstract.
summary: A research into task-specific directions.

tags:
  - Parameter Efficient Fine-tuning
  - Natural Language Processing
  - Machine Learning

# Display this page in the Featured widget?
featured: false

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: 'https://arxiv.org/abs/2409.01035'
url_code: 'https://github.com/Chongjie-Si/Subspace-Tuning'

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

