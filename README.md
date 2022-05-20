# Chat Demo 

## Concept 
We are building a browser based chat application that imitates the multi channel nature of Slack. Invites can be sent via SMS and from within the application users can chat, invite/leave channels, send sms into the room chat, and more. 


## Server Side To Do's 
- [x] create a user object with JSON (for now) with chat token, member ID, phone number, approved channels, and password 
- [x] create a channel object with JSON (for now) with channel ID, all members, associated phone number (for sms -> room chat), and creation date

### Methods 
- [x] write a function to create a token 
- [x] write a function to validate the user id and password from the user object 
- [ ] write a function to check the user object for allowed channels 
- [ ] write an update token function to "update" (create a new token) with all the previous values as well as the changed value and update user object with new token and a route to handle this functionality when clicked in browser 
- [X] write a function to look up channels json object and return channel name/id with matching phone number when a inbound message is recieved
- [x] write a function to create a new channel and add it to the channel object
- [x] write function to add user to channel 
- [x] write function to remove user from channel 
- [x] write function to show all users in a channel 

### Routes 
- [x] handle signup info by creating token and user object and redirect to home page route
- [] add logic to reject user registration if matching phone number or username is found
- [x] validate login when login screen is submitted
- [] if login is valid, redirect to home page (just needs to be uncommented when home.html exists)
- [x] if login is invalid, show error and return to sign in page
- [] add login counter? i.e. after 3 attempts, ban user from trying again for x amount of time 
- [ ] handle home page route by calling function to get a user's allowed channels and passing it to front end via express 
- [ ] handle updating token and user object (changing member ID, phone number, or allowed channels) by calling update token route and reloading the page with the relevant new information 
- [X] write route to handle inbound sms by using channel phone number lookup function to find the correct channel ID associated with the number that received the message and the correct user whose phone number in the user object matches the from number 
- [x] write a route to handle receiving form data and using it with the create new channel function to add a new channel (maybe optional parameter to specify users who should be added like slack has it?)
- [x] write a route to handle adding user, removing users, and show all users 

## Client Side To Do's 

## Views
- [x] create a sign-up form page 
- [x] create log in page 
- [ ] create home page showing all channels in side nav and current channel in main page (buttons to send message, leave channel, add someone to channel, view all members in a channel) 
- [ ] create user settings page with ability to change member ID, phone number, and allowed channels (anything else we want?)


## JS
- [x] on click for sign up, send information to server app, create a token, and create a user object 
- [x] add regex validation for password and phone number in sign up page 
- [x] on click for sign in, send user ID and password to server app for password validation
- [ ] after sign up is successful or password validation is successful, redirect to home page by using route to find allowed channels 
- [ ] on click of other channel, should reload home page with the new 'current' channel 
 

## Next Steps/Concepts to Look Into 
- Abstracting the methods 
- nosql or sqllite or something other than json 
