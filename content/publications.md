---
title: 'Publications'
date: 2024-05-19
type: landing

design:
  # Section spacing
  spacing: '5rem'

sections:
  - block: collection
    id: papers
    content:
      title: Featured Publications
      filters:
        folders:
          - full-publications
        featured_only: true
    design:
      view: article-grid
      columns: 2
  - block: collection
    content:
      title: Recent Publications
      text: You can also find my articles on my <a href="https://scholar.google.com/citations?user=wXc2EtsAAAAJ&hl=zh-CN"><strong>Google Scholar</strong></a> profile.
      count: 5
      filters:
        folders:
          - full-publications
        exclude_featured: false
    design:
      view: citation
---