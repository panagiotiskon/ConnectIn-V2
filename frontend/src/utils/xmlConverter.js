import json2xml from 'json2xml';

export const convertToXML = (data) => {
  try {
    const usersXmlData = {
      users: Object.entries(data).map(([userId, userDetails]) => ({
        user: {
          id: { id: userId },
          experiences: Array.isArray(userDetails.experiences)
            ? userDetails.experiences.map((exp) => ({
                experience: {
                  jobTitle: exp.jobTitle || '',
                  companyName: exp.companyName || '',
                  startDate: exp.startDate || '',
                  endDate: exp.endDate || '',
                  isPublic: exp.isPublic,
                },
              }))
            : [],
          skills: Array.isArray(userDetails.skills)
            ? userDetails.skills.map((skill) => ({
                skill: {
                  skillTitle: skill.skillTitle || '',
                  skillDescription: skill.skillDescription || '',
                  isPublic: skill.isPublic,
                },
              }))
            : [],
          education: Array.isArray(userDetails.education)
            ? userDetails.education.map((edu) => ({
                education: {
                  universityName: edu.universityName || '',
                  fieldOfStudy: edu.fieldOfStudy || '',
                  startDate: edu.startDate || '',
                  endDate: edu.endDate || '',
                  isPublic: edu.isPublic,
                },
              }))
            : [],
          jobApplications: Array.isArray(userDetails.jobApplications)
            ? userDetails.jobApplications.map((app) => ({
                jobApplication: {
                  jobId: app.jobId || '',
                  applicationDate: app.applicationDate || '',
                  status: app.status || '',
                },
              }))
            : [],
          connectedUsers: Array.isArray(userDetails.connectedUsers)
            ? userDetails.connectedUsers.map((connection) => ({
                connection: {
                  connectionId: connection.connectionId || '',
                  connectedUserId: connection.connectedUserId || '',
                  createdAt: connection.createdAt || '',
                },
              }))
            : [],
          jobPosts: Array.isArray(userDetails.jobPosts)
            ? userDetails.jobPosts.map((post) => ({
                jobPost: {
                  postId: post.postId || '',
                  jobTitle: post.jobTitle || '',
                  postDate: post.postDate || '',
                  status: post.status || '',
                },
              }))
            : [],
          posts: Array.isArray(userDetails.posts)
            ? userDetails.posts.map((post) => ({
                post: {
                  postId: post.postId || '',
                  content: post.content || '',
                  createdAt: post.createdAt || '',
                  file: post.file || null, // Handle if file is null
                },
              }))
            : [],
          comments: Array.isArray(userDetails.comments)
            ? userDetails.comments.map((comment) => ({
                comment: {
                  commentId: comment.commentId || '',
                  content: comment.content || '',
                  createdAt: comment.createdAt || '',
                  userId: comment.userId || '',
                  username: comment.username || '',
                },
              }))
            : [],
          reactions: Array.isArray(userDetails.reactions)
            ? userDetails.reactions.map((reaction) => ({
                reaction: {
                  reactionId: reaction.reactionId || '',
                  postId: reaction.postId || '',
                  createdAt: reaction.createdAt || '',
                },
              }))
            : [],
        },
      })),
    };

    return json2xml(usersXmlData, { header: true });
  } catch (error) {
    console.error('Error converting to XML:', error);
    throw error;
  }
};

export default convertToXML;
