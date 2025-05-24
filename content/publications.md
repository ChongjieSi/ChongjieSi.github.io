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
      title: Selected Publications
      text: You can find my articles on <a href="/full-publications"><strong>Full-Publications</strong></a> page or my <a href="https://scholar.google.com/citations?user=wXc2EtsAAAAJ&hl=zh-CN"><strong>Google Scholar</strong></a> profile.
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
      text: You can find my articles on <a href="/full-publications"><strong>Full-Publications</strong></a> page or my <a href="https://scholar.google.com/citations?user=wXc2EtsAAAAJ&hl=zh-CN"><strong>Google Scholar</strong></a> profile.
      count: 6
      filters:
        folders:
          - full-publications
        exclude_featured: false
    design:
      view: citation
---