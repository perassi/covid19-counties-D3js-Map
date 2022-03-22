const SlackWebhook = require('slack-webhook');

const slack = new SlackWebhook(
  'https://hooks.slack.com/services/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',
  {
    defaults: {
      username: 'Deploy Man',
      channel: '#coronavirus',
      icon_emoji: ':robot_face:',
    },
  },
);

slack
  .send({
    text: `:rocket: :rocket: :rocket: COVID-19 Counties viz deployed! <http://www.visavisllc.com/covid19-US-Counties|click here> to check it out!`,
  })
  .then(() => process.exit(0));
