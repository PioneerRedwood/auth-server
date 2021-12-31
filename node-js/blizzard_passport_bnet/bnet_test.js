/**
 * 2021-12-31
 * 앞서 한 것이 안 됐던 원인은 모듈 설치가 원활하지 않았던 것으로 추정된다.
 * 이걸 발전시켜서 진행 중인 것(CefGrogu)에 넣도록 한다
 */


require('dotenv').config();

const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const BnetStrategy = require('passport-bnet').Strategy;

// const BNET_ID = process.env.BNET_OAUTH_CLIENT_ID;
// const BNET_SECRET = process.env.BNET_OAUTH_CLIENT_SECRET;
const OAUTH_CALLBACK_URL = process.env.OAUTH_CALLBACK_URL || "http://localhost:3000/oauth/battlenet/callback";
// Review full list of available scopes here: https://develop.battle.net/documentation/guides/using-oauth
// const OAUTH_SCOPES = process.env.OAUTH_SCOPES || "wow.profile"; // 가져올 프로필 포함

const OAUTH_SCOPES = process.env.OAUTH_SCOPES;

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Register the BnetStrategy within Passport.
passport.use(
  new BnetStrategy(
    { clientID: BNET_ID,
      clientSecret: BNET_SECRET,
      scope: OAUTH_SCOPES,
      callbackURL: OAUTH_CALLBACK_URL },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    })
);

const app = express();

// configure Express
app.use(cookieParser());
app.use(session({ secret: 'passport-battlenet-example', // Change this value to a unique value for your application!
                  saveUninitialized: true,
                  resave: true }));

// Initialize Passport! Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.get('/oauth/battlenet',
        passport.authenticate('bnet'));

app.get('/oauth/battlenet/callback',
        passport.authenticate('bnet', { failureRedirect: '/' }),
        function(req, res){
          res.redirect('/');
        });

app.get('/', function(req, res) {
  if(req.isAuthenticated()) {
    const output = `
      <html>
        <body>
          <h1>Express Passport-Bnet OAuth Example</h1>
          <table>
            <tr>
              <th>Account ID</th>
              <th>Battletag</th>
            </tr>
            <tr>
              <td>${req.user.id}</td>
              <td>${req.user.battletag}</td>
            </tr>
          </table>
          <br />
          <a href="/logout">Logout</a>
        </body>
      </html>
    `;
    res.send(output);
  } else {
    const output = `
      <html>
        <body>
          <h1>Express Passport-Bnet OAuth Example</h1>
          <br />
          <a href="/oauth/battlenet">Login with Bnet</a>
        </body>
      </html>
    `;
    res.send(output);
  }
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.use(function (err, req, res, next) {
  console.error(err);
  res.send("<h1>Internal Server Error</h1>");
});

const server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});