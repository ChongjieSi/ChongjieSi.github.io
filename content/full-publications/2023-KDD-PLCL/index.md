---
title: 'Complementary Classifier Induced Partial Label Learning'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - Yuheng Jia
  - Admin
  - Min-Ling Zhang
# Author notes (optional)
# author_notes:
#   - Equal contribution
#   - Equal contribution
#   - Southeast University

date: '2023-08-04T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
publishDate: '2023-08-04T00:00:00Z'

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ['paper-conference']

# Publication name and optional abbreviated publication name.
publication: The 29th ACM SIGKDD Conference on Knowledge Discovery and Data Mining
publication_short: <b>KDD</b>, <font color="#FF79BC">**Oral**</font>

abstract: In partial label learning (PLL), each training sample is associated with a set of candidate labels, among which only one is valid. The core of PLL is to disambiguate the candidate labels to get the ground-truth one. In disambiguation, the existing works usually do not fully investigate the effectiveness of the non-candidate label set (a.k.a. complementary labels), which accurately indicates a set of labels that do not belong to a sample. In this paper, we use the non-candidate labels to induce a complementary classifier, which naturally forms an adversarial relationship against the traditional PLL classifier, to eliminate the false-positive labels in the candidate label set. Besides, we assume the feature space and the label space share the same local topological structure captured by a dynamic graph, and use it to assist disambiguation. Extensive experimental results validate the superiority of the proposed approach against state-of-the-art PLL methods on 4 controlled UCI data sets and 6 real-world data sets and reveal the usefulness of complementary learning in PLL. The code has been released.

# Summary. An optional shortened abstract.
summary: A PLL approach employing a complementary classifier for disambiguation.

tags:
  - Partial Label Learning
  - Machine Learning

# Display this page in the Featured widget?
featured: false

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: 'https://dl.acm.org/doi/abs/10.1145/3580305.3599282'
url_code: 'https://github.com/Chongjie-Si/PL-CL'
url_poster: 'paper-poster/2023-KDD-PLCL.pdf'
url_video: 'https://dl.acm.org/doi/abs/10.1145/3580305.3599282'

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

