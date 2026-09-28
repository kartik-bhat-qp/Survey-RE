# PRD: Build with AI — BI Widget Builder

## Slide 1

Build with AI

Business Intelligence

## Slide 2

Introduction & problem

Dashboard authors currently choose a question-based or advanced widget and configure it manually. They need a simpler way to express a custom visualization using their selected survey questions.



Build with AI introduces a guided, prompt-based entry point. This prototype validates setup and placement only: Create widget inserts a placeholder. AI generation and backend integration are deferred.

## Slide 3

User journey

Open a BI dashboard → Add widget → Build with AI.
Enter a widget name and click Next.
Select one survey from the survey browser.
Check one or more questions and click Next.
Enter an optional description and click Create widget.
Review the placeholder in the current dashboard tab.
Use the three-dot menu → Settings to edit name or highlight.
Reuse the widget from Advanced widgets during the session.

## Slide 4

Business rules: setup

One survey, multiple questions

Name is required; whitespace alone cannot advance (100 characters maximum).
Select exactly one survey and at least one question.
Use the shared survey picker and question table with checkboxes.
Changing the survey clears question selections; Back preserves other details.
Description is optional and does not change the placeholder.
Closing the builder before creation adds nothing.

## Slide 5

Create widget adds one placeholder to the current tab and closes the builder.
No copy/paste handoff or preview checkpoint is shown.
Use the standard title, divider and three-dot menu; no AI badge above the name.
General settings edit name and highlight text (up to 500 characters).
Advanced widgets lists session-created widgets; reused copies have independent settings.
Page refresh clears widgets; server restart clears them after reconnection.

Business rules: widget & session

## Slide 6

Deferred scope

Deferred beyond this prototype

Live AI calls and generated HTML, CSS or JavaScript.
Production API discovery, data-contract mapping and backend integration.
Filters, weight schemes, slicers and Design/Analytics/Labels tabs.
Persistent storage, custom-widget exports and shared-view integration.
Analytical results: the current card is a placeholder only.

## Slide 7

Scope

Build with AI sits beside Question based and Advanced widgets.
Reuse the light-blue AI icon and standard modal styling.
Name → Survey → Questions → Build; no Cancel button.
Description is optional, up to 6,000 characters.
Create a standard BI card with General settings and session reuse.

## Slide 8

Acceptance criteria

Prototype acceptance criteria

Blank names block Next; one survey and one or more questions are required.
Any prompt, including blank, creates one placeholder with no extra dialog.
The header matches regular widgets: name, divider and three-dot menu.
Settings saves a nonblank name and highlight; there is no AI header badge.
Advanced widgets lists the new item for reuse with independent settings.
Refreshing clears custom widgets; existing widget creation flows remain available.

## Slide 9

Prototype access & review

Live prototype and review path

Prototype: https://survey-re.vercel.app/dashboards/1
Open Dashboards → Executive CX Overview → Add widget → Build with AI.
Enter a name, choose Demo survey 2026 and select two questions.
Enter any description, then create; review Settings and Advanced widgets.
Refresh the page to verify that session-created widgets disappear.
Deployment check, 28 Sep 2026: public site still shows the older picker.
The updated flow is verified locally and must be deployed for live review.