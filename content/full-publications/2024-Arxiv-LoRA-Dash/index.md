---
title: "Unleashing the Power of Task-Specific Directions in Parameter Efficient Fine-tuning"
authors:
  - Admin
  - Zhiyi Shi
  - Shifan Zhang
  - Xiaokang Yang
  - Hanspeter Pfister
  - Wei Shen

date: "2024-09-02T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2024-09-02T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ["article"]

# Publication name and optional abbreviated publication name.
publication: ""
publication_short: "<b>Arxiv</b>"

abstract: Large language models demonstrate impressive performance on downstream tasks, yet requiring extensive resource consumption when fully fine-tuning all parameters. To mitigate this, Parameter Efficient Fine-Tuning (PEFT) strategies, such as LoRA, have been developed. In this paper, we delve into the concept of task-specific directions--critical for transitioning large models from pre-trained states to task-specific enhancements in PEFT. We propose a framework to clearly define these directions and explore their properties, and practical utilization challenges. We then introduce a novel approach, LoRA-Dash, which aims to maximize the impact of task-specific directions during the fine-tuning process, thereby enhancing model performance on targeted tasks. Extensive experiments have conclusively demonstrated the effectiveness of LoRA-Dash, and in-depth analyses further reveal the underlying mechanisms of LoRA-Dash.

# Summary. An optional shortened abstract.
summary: A PEFT article which dives into the power of task-specific directions.

tags:
- Parameter Efficient Fine-tuning
- Natural Language Processing
- Machine Learning

featured: true

links:
- name: Project
  url: /project/2024-lora-dash.html
- name: QbitAI
  url: https://mp.weixin.qq.com/s/4S8ORbMpwcB_iXDbxgrHEw
- name: ZHIHU
  url: https://zhuanlan.zhihu.com/p/719930225
url_pdf: https://arxiv.org/abs/2409.01035
url_code: 'https://github.com/Chongjie-Si/Subspace-Tuning'



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
