*This project has been created as part of the 42 curriculum by brcoppie, fkrakow, lecartuy, stdevis*

# Description

The transcendence project is about creating a real-world web application as a team.
We chose to make a digital collectable card game ( https://en.wikipedia.org/wiki/Digital_collectible_card_game ).

To play our game, it is required to log in or register.
Each player has its own cards with which they can build decks.
With their decks, they can play against other players or an AI opponent of varying difficulty.

Our game also has a set of *social* features such as the ability to make friends, see their profile and chat with them, or connect with their 42 account instead of using email.

The details of our web app's architecture and features are in the **Features and Modules** (add links) sections.
We'll only present the app's services here (it's a containerised app). 
There are six of them:

1. an nginx proxy
2. a Next.js full-stack app
3. a node game engine
4. a socket.io node server
5. a redis in memory database
6. a postgres database

---
clearly presents the project, including its goal and a brief overview

also needs to contain a clear name for the project and its key features
---

# Instructions

First set up the environment variables.
Copy `.env.example` to `.env` and fill out your own values.
Then, to build the project for development, use `make` to call `make dev` (so either one works).
For production, use `make prod`.
We have to separate environment because we want to different builds.

In developmet the app has all its services exposed to a port.
The proxy's configurations accept HTTP requests and supports Hot Module Replacement (HMR) or the next.js app.
Additionally, the next.js app is not compiled therefore slower but works with HMR.
We also mount volumes from our local machine instead of directly embedding the source code in the container.

In production only the proxy is exposed and only accepts HTTPs requests.
Both the app and the game engine are compiled and embedded into the container instead of relying on mounted volumes.
The proxy also has more complex configurations to allow it to serve static assets directly instead of bothering the node server.

---
any relevant information about compilation, installation, and/or execution

mention all the needed prerequisites (software, tools, versions, configuration like .env setup, etc.), and step-by-step instructions to run the project
---

# Resources

---
list classics references related to the topic, as well as a description of how AI was used -- specifying for which tasks and which parts of the project
---

# Team Information

The product owners are brcoppie and stdevis.
They are responsible for the list of features and the look of the game.

The product manager is fkrakow.
He is responsible for keeping track of the project's progress.

The tech leads are lecartuy and stdevis.
They are responsible for the choice of technologies and code quality.

Everyone is a developer and must write code for their assigned features, participe in reviews, test the work, and document it.

---
for each team member present:
 - assigned role(s): PO, PM, Tech Lead, Developers, etc
 - brief description of their responsibilities
---

# Project Management

The work was divided into four fairly independent parts.
And we kept tabs on each other's work regularly with meetings and discussions in person or on discord.

The parts are: docker infrastructure, site design, game engine, ai opponent, user management.
The details on the order in which we implemented them and how we integrated them are in the **Features and Modules** (add links) sections.

---
how the team organised the work, which tools and channels were used for the project management
---

# Technical Stack

For the website we use the Next.js framework with Prisma as ORM and Socket.io to handle WebSockets.
There is also a redis service to keep track of connected users and cache some data, **notably for the game engine** (not yet done but might be interesting to look at).

For the site's styling, we use React components with TailwindCSS and ... for the 3D graphics...



---
frontend and backend technologies and frameworks used. The database system chosen and why. Any other significant technologies or libraries and justification for major technical choices
---

# Database Schema

---
visual representation or description of the database structure with tables and their relationships with key fields and datatypes
---

# Features List

---
complete list of implemented features, which team member(s) worked on each feature and a brief description of each feature's functionality
---

# Modules

---
list of all chosen modules with point calculation and justification for each module choice, how it was implemented, and which team member(s) worked on each module
---

# Individual Contributions

---
detailed breakdown of what each team member contributed, with specific features, modules, or components implemented by each person, and any challenges faced and how they were overcome
---
