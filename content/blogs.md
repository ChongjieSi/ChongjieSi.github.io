---
title: 'Blogs'
type: landing

cascade:
  - _target:
      kind: page
    params:
      show_breadcrumb: true

sections:
  - block: collection
    id: blogs
    content:
      title: Blogs
      count: 9
      filters:
        folders:
          - blog
    design:
      view: article-grid
      columns: 3
---
