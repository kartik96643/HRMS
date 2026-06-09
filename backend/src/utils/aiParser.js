const { PDFParse } = require('pdf-parse');
const { OpenAI } = require('openai');

// Pre-existing mock fallback logic
const mockParser = (candidateName, email, jobRequirements = []) => {
  const commonSkills = ['JavaScript', 'HTML5', 'CSS3', 'Git', 'REST APIs'];
  let specializedSkills = ['React', 'Node.js', 'Express', 'MongoDB'];
  if (email.includes('sales') || candidateName.toLowerCase().includes('sales')) {
    specializedSkills = ['Salesforce', 'Negotiation', 'CRM', 'Cold Calling', 'Lead Generation'];
  } else if (email.includes('hr') || candidateName.toLowerCase().includes('recruiter')) {
    specializedSkills = ['ATS', 'Interviews', 'Onboarding', 'Conflict Resolution', 'Employee Relations'];
  }

  const allCandidateSkills = [...new Set([...specializedSkills, ...commonSkills])];
  const index = Math.abs(candidateName.charCodeAt(0) % 4);
  const educationList = [
    'B.S. in Computer Science - State University',
    'B.A. in Business Administration - Valley College',
    'M.S. in Software Engineering - Tech Institute',
    'High School Diploma - City High'
  ];
  const experienceList = [
    '3+ years of experience as a Software Specialist in retail systems.',
    '2 years of experience handling business pipelines and client communications.',
    '5+ years leading organizational planning and personnel teams.',
    'Entry-level candidate with solid academic projects and internships.'
  ];

  let matchingSkills = [];
  let missingSkills = [];
  if (jobRequirements && jobRequirements.length > 0) {
    jobRequirements.forEach(req => {
      if (allCandidateSkills.some(s => s.toLowerCase() === req.toLowerCase())) {
        matchingSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });
  }

  const matchRatio = jobRequirements.length > 0 ? matchingSkills.length / jobRequirements.length : 0.8;
  const matchPercentage = Math.round(matchRatio * 100);

  return {
    extractedInfo: {
      skills: allCandidateSkills,
      experience: experienceList[index],
      education: educationList[index],
      certifications: ['AWS Cloud Practitioner']
    },
    aiMatch: {
      matchPercentage,
      matchingSkills,
      missingSkills,
      candidateSummary: `${candidateName} matches ${matchingSkills.length} out of ${jobRequirements.length} requirements. (Fallback Mock Parser)`
    }
  };
};

const parseResumeAndScore = async (candidateName, email, jobRequirements = [], file = null) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const isOpenAIConfigured = apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.startsWith('sk-');

  if (!isOpenAIConfigured) {
    console.warn('OpenAI key not configured or using placeholders. Using mock fallback parser.');
    return mockParser(candidateName, email, jobRequirements);
  }

  try {
    // 1. Extract text from uploaded resume file
    let resumeText = '';
    if (file && file.buffer) {
      if (file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: file.buffer });
        const parsedPdf = await parser.getText();
        resumeText = parsedPdf.text;
      } else if (file.mimetype.startsWith('text/')) {
        resumeText = file.buffer.toString('utf-8');
      } else {
        resumeText = `Filename: ${file.originalname}. Raw Buffer Size: ${file.size} bytes.`;
      }
    } else {
      resumeText = 'No file uploaded. Parsing profile metadata only.';
    }

    // 2. Query OpenAI API
    const openai = new OpenAI({ apiKey });
    const systemPrompt = `You are an expert HR recruiter and AI parsing system.
Analyze the candidate's resume text and calculate their fit match percentage against the specified job requirements.
You MUST respond with a valid JSON object matching this schema exactly:
{
  "extractedInfo": {
    "skills": ["string"],
    "experience": "string summarizing work history length and roles",
    "education": "string summarizing degrees and colleges",
    "certifications": ["string"]
  },
  "aiMatch": {
    "matchPercentage": number (0 to 100 representing job requirements fit),
    "matchingSkills": ["string of skills present in job requirements"],
    "missingSkills": ["string of skills missing from job requirements"],
    "candidateSummary": "string summarizing candidate strengths and gaps"
  }
}`;

    const userPrompt = `Candidate Name: ${candidateName}
Email: ${email}
Job Requirements: ${JSON.stringify(jobRequirements)}
Resume Text:
${resumeText.substring(0, 8000)}`; // limit size to keep token count reasonable

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('OpenAI Resume Parsing Error:', error.message);
    console.warn('Falling back to mock parser due to OpenAI error.');
    return mockParser(candidateName, email, jobRequirements);
  }
};

module.exports = { parseResumeAndScore };
