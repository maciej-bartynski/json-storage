# Phase
Analyse

# Task

## Current task is: 
Create README.md and docs/DEVELOPMENT.md for the Current Project

## Goal
Produce two complementary documentation files — `README.md` and `docs/DEVELOPMENT.md` — that together form the **single source of truth** for the project.  
The documentation must be understandable and actionable by both **human developers** and **AI assistants**.  
It should be written in **direct, imperative language** with no ambiguity.

Both files combined must fully describe how to understand, maintain, develop, test, and publish the project to production.  
**No information should be duplicated** between the two files.  
`docs/DEVELOPMENT.md` may extend points from `README.md` but should not repeat them.

---

## General Workflow
1. **Index and analyze the entire codebase** before creating either file.
2. Identify all relevant details about:
   - Project structure
   - Code type (frontend, backend, or both)
   - Language and version (JavaScript ECMAScript version, TypeScript version if applicable)
   - All commands in `package.json` and their purpose
   - Build tools, configurations, and workflows
   - Testing tools, configurations, and scope (source code or build code)
   - Transpilation details (if TypeScript is used)
   - Environment variables: purpose, usage, and load timing
   - Mode configurations (development, production, testing, and any others)
   - Concurrency requirements (multiple processes running together)
   - Additional installed developer tools
   - CI/CD pipeline setup and required configuration files
   - Frameworks or libraries in use (or if code is vanilla)
3. Re-think how to organise this knowledge into direct, descriptive files, without unnecessary, to obvious or made-up informations.
4. Decide which content belong in `README.md` and which belong in `docs/DEVELOPMENT.md` (see file-specific requirements below).

---

## README.md Requirements
Purpose:
- Default project description in repository (e.g., GitHub visitors)
- NPM package description (if applicable)
- High-level technical overview for both humans and AI
- Quickstart guidance for a new developer joining the team

Content:
- Concise but complete overview of the project’s purpose, scope, and functionality
- High-level technical stack summary (languages, frameworks, major tools)
- Quickstart instructions for setting up the project locally (minimal detail — enough to start)
- Any critical project constraints or prerequisites
- Link to `docs/DEVELOPMENT.md` for deeper technical guidance

---

## docs/DEVELOPMENT.md Requirements
Purpose:
- Detailed technical guide for developing, maintaining, and deploying the project
- Precise operational instructions for **all modes** (development, production, testing, etc.)
- Full tooling, versioning, and environment setup details
- Coding standards or guidelines (if any)

Content:
- Detailed setup instructions for local development
- How to run each available mode (development, production, testing, and others)
- Explanation of build, transpilation, and test tool configurations
- Step-by-step guidance for workflows (development, testing, deployment)
- Environment variables: exact purpose, when they load, and how to set them
- CI/CD pipeline steps and configuration requirements
- Any concurrency or multi-process setup instructions
- List of all developer tools and their purpose
- Framework/library usage with relevant version details
- Coding standards and conventions

---

## Rules for Both Files
- **No vague language** — write as if every reader has zero prior knowledge of this project. 
- However, every reader has general prior knowledge of JavaScript ecosystem, git and programming in general.
- **No assumptions** — explicitly state all steps, paths, commands, and configurations, specific to this project. 
- Use the **same terminology consistently** across both files.
- Provide **examples** for commands, configurations, and workflows when useful.
- Organize content with clear headings and ordered steps.
- Both humans and AI should be able to follow the instructions without external help.
- Avoid unnecessary content at all cost.

   Example of unnecesary content for `README.md` - this content is to obvious:

   > Clone repo:
   > ```bash
   > git clone {repo-url}
   > ```

   Example of unnsecessary content for `docs/DEVELOPMENT.md` - this content is made-up:

   Troubleshooting: *whole section, because you don't know anything of project problems yet*

- Read and follow your own instructions, to check if they are accurate

---

## Deliverables
1. `README.md` — High-level overview and quickstart instructions.
2. `docs/DEVELOPMENT.md` — Complete technical development guide.

---

## Documentation Quality Rules

### Content Creation Rules
- **NEVER** create sections "out of thin air"
- **NEVER** include obvious information (e.g., "Clone the repository")
- **ALWAYS** verify information accuracy before including
- **If unsure**: Ask user or skip the section
- **Content must be**: Specific, actionable, and verified
- Ensure no duplicated content between files.
- Validate that a new developer (human or AI) could work with the project using only these two files.
- Confirm that production deployment can be done following only these docs.

### Documentation Testing Rules
- **ALWAYS** test documentation examples and workflows
- **NEVER** assume documentation is correct without verification
- **If testing fails**: Ask user if you can ignore errors or request manual cleanup
- **Proactive testing**: Test before declaring documentation complete
- **Test coverage**: Verify all commands, workflows, and examples work as documented

### Quality Verification Process
1. **Before declaring complete**: Test all documented workflows
2. **If errors occur**: Document them and ask user how to proceed
3. **If cleanup needed**: Request user permission or ask for manual cleanup
4. **Final verification**: Ensure documentation matches actual project behavior

# Progress logs