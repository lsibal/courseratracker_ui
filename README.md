# CourseTrack - SHIELD Foundry Course Scheduler

**Mark James Bonifacio** - MAR 10 2025 - JUN 9 2025

---

# 1. Setup the App

[1] Go to this website:
`https://github.com/lsibal/courseratracker_ui`

[2] Once the repo is opened, click the **`<>Code`** button. Click HTTPS, and copy the URL. You will be getting this:

```
https://github.com/lsibal/courseratracker_ui.git
```

[3] Open a command prompt in the desktop or any folder, and type this command:

```
git clone https://github.com/lsibal/courseratracker_ui.git
```

The git repo will be cloned in the directory.

---

# 2. Run the App

## Make sure to run the courseratracker_api SIMULTANEOUSLY for Hourglass API communication.

[1] Navigate to courseratracker_ui folder in the file explorer. In the address bar, type `cmd`, or open a new command prompt in the folder directory.

[2] Once done, it will open a command prompt. Type `npm run dev`.

[3] The command prompt will print a line something like this:

```
  VITE v6.2.3  ready in 2627 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

[4] Go to the local address in a web browser. Type the `http://localhost:5173/` in the address bar.

---

# 3. Account Creation and Usage

[1] Click `Sign up now`. It will redirect you to the **Register** page.

[2] Fill up the account details. Once you have successfully created an account, it will bring you to the main application.

[3] To get started, click on any FUTURE date within the calendar. There are 7 slots to choose from.

[4] To create a course, **MAKE SURE THE BACKEND API IS ALSO RUNNING**, as it uses it to communicate with Hourglass API.

[5] If no courses present, or if the courses present aren't what you are interested in, click `Create new course`.

---

# The End