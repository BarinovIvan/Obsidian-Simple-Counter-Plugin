# Obsidian Simple Counter Plugin
_Author: [Barinov Ivan](https://github.com/BarinovIvan)_
_Contributors: [SteveOverSea](https://github.com/SteveOverSea)_


Introducing the `Simple Counter` - a powerful tool designed to enhance your productivity and streamline your workflow in Obsidian

This plugin takes your note-taking to a whole new level by automatically incrementing a counter in the YAML front matter of your markdown files each time you open them. But here's the twist - it only does this for files located in specific folders that you choose. This means you can keep track of how often you revisit certain topics or documents without cluttering up your entire note-taking system with unnecessary counters.

Imagine having a dedicated counter for each topic or project you're working on, automatically updating every time you open the corresponding note. This can be particularly useful for tracking progress, keeping notes organized, and maintaining a record of your activity.

# Instructions: 
- Firstly, add directory where plugin should work or make plugin work for every note in your vault in plugin's settings
- Then add `visited` property to YAML FrontMatter of your note (You can make plugin automatically create 'visited' yaml property if it`s not existing)
- **You are ready to go!**

# Example:
Let's assume `My Note` is located in directory where plugin works.

Here is the Note`s YAML FrontMatter: 
```yaml
---
title: My Note
visited: 1
---
<Note Content>
```

If you open this note in Obsidian, the plugin will increase the visited property by one, resulting in:

```yaml
---
title: My Note
visited: 2
---
<Note Content>
```

The next time you open the note, the visited property will be increased again, and so on.
