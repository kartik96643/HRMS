const { PDFParse } = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
  const apiKey = process.env.GEMINI_API_KEY;
  const isGeminiConfigured = apiKey && apiKey.trim() !== '' && apiKey.trim() !== 'your_gemini_api_key_here';

  if (!isGeminiConfigured) {
    console.warn('Gemini API key not configured or using placeholders. Using mock fallback parser.');
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

    // 2. Query Gemini API
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Using gemini-2.5-flash which is supported by the API key and supports JSON schema
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            extractedInfo: {
              type: 'object',
              properties: {
                skills: {
                  type: 'array',
                  items: { type: 'string' }
                },
                experience: { type: 'string' },
                education: { type: 'string' },
                certifications: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['skills', 'experience', 'education', 'certifications']
            },
            aiMatch: {
              type: 'object',
              properties: {
                matchPercentage: { type: 'integer' },
                matchingSkills: {
                  type: 'array',
                  items: { type: 'string' }
                },
                missingSkills: {
                  type: 'array',
                  items: { type: 'string' }
                },
                candidateSummary: { type: 'string' }
              },
              required: ['matchPercentage', 'matchingSkills', 'missingSkills', 'candidateSummary']
            }
          },
          required: ['extractedInfo', 'aiMatch']
        }
      }
    });

    const systemPrompt = `You are an expert HR recruiter and AI parsing system.
Analyze the candidate's resume text and calculate their fit match percentage against the specified job requirements.`;

    const userPrompt = `Candidate Name: ${candidateName}
Email: ${email}
Job Requirements: ${JSON.stringify(jobRequirements)}
Resume Text:
${resumeText.substring(0, 8000)}`;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
      ]
    });

    const responseText = result.response.text();
    const parsedResult = JSON.parse(responseText);
    return parsedResult;

  } catch (error) {
    console.error('Gemini Resume Parsing Error:', error.message);
    console.warn('Falling back to mock parser due to Gemini error.');
    return mockParser(candidateName, email, jobRequirements);
  }
};

module.exports = { parseResumeAndScore };
