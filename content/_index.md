---
# Leave the homepage title empty to use the site title
title: ""
date: 2022-10-24
type: landing

design:
  # Default section spacing
  spacing: "6rem"

sections:
  - block: resume-biography-3
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
      text: ""
      # Show a call-to-action button under your biography? (optional)
    design:
      css_class: dark
      background:
        color: black
        image:
          # Add your image background to `assets/media/`.
          filename: back.svg
          filters:
            brightness: 0.8
          size: cover
          position: center
          parallax: false
  - block: markdown
    content:
      title: '📚 My Research'
      subtitle: ''
      text: |-
        I have experience in the fields of machine learning, computer vision, and natural language processing, and have worked on projects in all of these areas.

        I'm now interested in LLM related areas.
        
        Please reach out for collaboration! 😃
    design:
      columns: '1'

  # - block: collection
  #   id: talks
  #   content:
  #     title: Talks
  #     text: 
  #     filters:
  #       folders:
  #         - talks
  #   design:
  #     view: card
  #     fill_image: false
  #     columns: 1

  - block: collection
    id: news
    content:
      title: <h2 class="section-heading-news">💥 Recent News</h2>
      subtitle: ''
      text: ''
      # Page type to display. E.g. post, talk, publication...
      # page_type: page
      # Choose how many pages you would like to display (0 = all pages)
      count: 10
      # Filter on criteria
      filters:
        exclude_featured: false
        exclude_future: false
        exclude_past: false
        folders:
          - news
      # Choose how many pages you would like to offset by
      offset: 0
      # Page order: descending (desc) or ascending (asc) date.
      order: desc
    design:
      # Choose a layout view
      view: date-title-summary
      # Reduce spacing
      spacing:
        padding: [0, 0, 0, 0]
---
