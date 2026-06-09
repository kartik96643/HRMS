// Mock AI Performance Summary Generator
const generatePerformanceSummary = (ratings, feedback) => {
  const keyStrengths = [];
  const areasForImprovement = [];
  const developmentRecommendations = [];

  // Determine strengths/improvements based on numeric ratings
  if (ratings.quality >= 4) {
    keyStrengths.push('High attention to detail and quality of work deliverables.');
  } else {
    areasForImprovement.push('Consistency in work quality and output accuracy.');
    developmentRecommendations.push('Participate in peer-review cycles to gather quality checks before submission.');
  }

  if (ratings.teamwork >= 4) {
    keyStrengths.push('Excellent collaboration, supportive attitude, and teamwork values.');
  } else {
    areasForImprovement.push('Active participation in collaborative tasks and team sprints.');
    developmentRecommendations.push('Lead or co-host a cross-functional department brainstorming workshop.');
  }

  if (ratings.communication >= 4) {
    keyStrengths.push('Clear, proactive communication across teams and stakeholders.');
  } else {
    areasForImprovement.push('Proactive communication of blocks and status updates.');
    developmentRecommendations.push('Commit to daily standup posts with explicit blocks and progress details.');
  }

  if (ratings.productivity >= 4) {
    keyStrengths.push('Strong velocity and productivity metrics in sprint goals.');
  } else {
    areasForImprovement.push('Time-management and velocity in hitting scheduled sprint targets.');
    developmentRecommendations.push('Complete time-management coaching sessions and utilize blockers early.');
  }

  // Fallback defaults
  if (keyStrengths.length === 0) {
    keyStrengths.push('Willingness to learn and adapt to new instructions.');
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push('Continuing to scale current leadership capabilities.');
  }
  if (developmentRecommendations.length === 0) {
    developmentRecommendations.push('Engage in professional leadership certification tracks.');
  }

  // Construct a summary sentence
  const avgRating = (ratings.quality + ratings.teamwork + ratings.communication + ratings.productivity) / 4;
  let summaryPrefix = '';
  if (avgRating >= 4) {
    summaryPrefix = 'Demonstrates outstanding performance, exceeding baseline targets consistently. They show high competence and are a key team contributor.';
  } else if (avgRating >= 3) {
    summaryPrefix = 'Maintains satisfactory performance, meeting core job expectations and requirements. They show steady progress with some target growth areas.';
  } else {
    summaryPrefix = 'Needs improvement to meet target performance standards. Attention is required to align output levels with role expectations.';
  }

  const overallSummary = `${summaryPrefix} Manager comments highlight: "${feedback}"`;

  return {
    keyStrengths,
    areasForImprovement,
    overallSummary,
    developmentRecommendations
  };
};

module.exports = { generatePerformanceSummary };
