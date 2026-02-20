1. 📌 Purpose of This Document

This document defines the scope, responsibilities, constraints, and usage guidelines of the AI agent provided by the Antigravity framework, used during the development of this project.

The AI agent acts strictly as a development assistant.
It is not an autonomous system designer or decision-maker.

This document ensures:

Responsible AI usage

Clear ownership of decisions

Controlled and predictable AI behavior

2. 🎯 Objective of Using the AI Agent

The AI agent is used to:

Improve development productivity

Reduce boilerplate and repetitive coding effort

Assist in scaffolding and structuring code

Accelerate iteration during development

The AI agent is not used to:

Replace developer understanding

Make architectural decisions

Apply logic without human reasoning

3. 🧠 Role of the AI Agent (What It CAN Do)

The AI agent is explicitly allowed to assist with the following tasks.

3.1 Code Scaffolding

The AI agent may:

Generate initial file and folder structures

Create boilerplate code for components

Create controllers and service skeletons

3.2 Repetitive Implementation Assistance

The AI agent may help with:

Form validation logic

CRUD endpoint templates

Basic UI component structures

API request and response handlers

3.3 Refactoring Support

The AI agent may:

Suggest code cleanup

Improve readability

Align code with TypeScript best practices

Suggest naming and structure improvements

3.4 Documentation Assistance

The AI agent may:

Help generate code comments

Assist in formatting technical documentation

Maintain documentation consistency across files

4. 🚫 Role Boundaries (What the AI Agent MUST NOT Do)

The AI agent is strictly prohibited from the following actions:

❌ Making independent architectural decisions

❌ Designing the database schema autonomously

❌ Defining business logic without developer review

❌ Deciding security rules or access control

❌ Implementing features not defined in the PRD

❌ Changing system behavior without instruction

❌ Acting without human validation

All critical decisions remain entirely under developer control.

5. 🧩 Decision Ownership

Decision ownership for this project is clearly defined.

System architecture → Developer

Database design → Developer

API contracts → Developer

Security and authentication logic → Developer

UI and UX design → Developer

Feature scope and roadmap → Developer

AI agent → Assistive role only

The AI agent does not own any system decision.

6. 🔁 Human-in-the-Loop Workflow

The development process strictly follows a human-in-the-loop model.

Workflow:

Developer defines task
↓
AI agent suggests solution
↓
Developer reviews and understands
↓
Developer modifies if needed
↓
Developer approves and integrates

No AI-generated output is used without review.

7. 🧪 Quality & Validation Rules

All AI-assisted outputs must:

Compile without errors

Follow TypeScript standards

Align with PRD, Design Doc, and Architecture Doc

Pass basic functional testing

Be readable and maintainable

The developer is responsible for validation and correctness.

8. 🔐 Security & Ethical Constraints

The AI agent must follow strict security and ethical rules:

No generation of sensitive credentials

No exposure of production secrets

No plagiarism of proprietary systems

Transparent and documented AI usage

Security and ethics are non-negotiable.

9. 🛠️ Tools & Environment Context

The AI agent operates within the following technical constraints:

Antigravity Framework

TypeScript (Frontend and Backend)

PostgreSQL (NeonDB)

Prisma ORM

Tailwind CSS

Animation libraries (Fluid / Motion)

The AI agent must respect and align with this environment.

10. 🎓 Academic Integrity Statement

The AI agent is used as a development aid, similar to:

Documentation

Code templates

IDE assistance

All understanding, explanation, and ownership of the system remains with the developer.

The project is:

Not auto-generated

Fully designed by the developer

Implemented with AI assistance for efficiency only

11. 🏁 Conclusion

This AI Agent Instruction Document ensures:

Responsible AI usage

Clear ownership of all decisions

Ethical and academic transparency

Controlled and effective AI assistance

The AI agent enhances productivity without compromising understanding, control, or authorship.