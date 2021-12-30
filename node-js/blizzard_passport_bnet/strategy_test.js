/**
 * 2021-12-30 from https://github.com/Blizzard/passport-bnet
 *  - 원활한 인증이 안된다, 다시 해봐야할 것 같다
 *  - BNET_ID, BENT_SECRET은 블리자드 개발자 홈페이지에서 생성하면 된다 https://develop.battle.net/access/clients/
 *  - 리디렉션 URL, 서비스 URL을 명확하게 이해하고 설정해야 한다
 *   
 */

const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const BnetStrategy = require('passport-bnet').Strategy;
// const BNET_ID = process.env.BNET_ID;
// const BNET_SECRET = process.env.BNET_SECRET;

const OAUTH_CALLBACK_URL = "https://localhost:3000/oauth/battlenet/callback";
// const OAUTH_SCOPES = || "wow.profile";

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// Register the BnetStrategy within Passport
passport.use(
    new BnetStrategy(
        {
            clientID: BNET_ID,
            clientSecret: BNET_SECRET,
            // scope:
            callbackURL: OAUTH_CALLBACK_URL
            // region: "us" 
        }, function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
                return done(null, profile);
            });
        })
);

const app = express();

app.use(cookieParser());
app.use(
    session({
        secret: 'passport-battlenet-test',
        saveUninitialized: true,
        resave: true
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/oauth/battlenet', passport.authenticate('bnet'));

app.get(
    '/oauth/battlenet/callback',
    passport.authenticate('bnet', { failureRedirect: '/' }),
    function (req, res) {
        console.log("who are you?");
        res.redirect('/');
    });

app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
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

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.use(function (err, req, res, next) {
    console.error(err);
    res.send("<h1>Internal Server Error</h1>");
});

const server = app.listen(3000, function () {
    console.log("listen on port %d", server.address().port);
});


