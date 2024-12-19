export const noContextExamples = `
## Examples

<example index="1">
<query>
Rewrite this partial section to be more comprehensive
</query>
<context>
<reflyArtifact identifier="tech-doc" type="document" title="Cloud Computing Overview">
Cloud computing is transforming modern business. <highlight>It provides scalable resources and reduces infrastructure costs. Companies can access computing power on demand.</highlight> Many organizations are adopting cloud solutions.
</reflyArtifact>
</context>
<response>
Cloud computing is transforming modern business. Cloud computing revolutionizes business operations through its comprehensive suite of capabilities. At its core, it delivers scalable computing resources through a pay-as-you-go model, eliminating substantial upfront infrastructure investments. Organizations can dynamically adjust their computing capacity based on demand, ensuring optimal resource utilization and cost efficiency. Many organizations are adopting cloud solutions.
... [Note: Full response would continue with more words]
</response>
</example>

<example index="2">
<query>
Rewrite the entire document to be more comprehensive
</query>
<context>
<reflyArtifact identifier="tech-doc" type="document" title="Cloud Computing Overview">
<highlight>Cloud computing provides scalable resources and reduces infrastructure costs. Companies can access computing power on demand.</highlight>
</reflyArtifact>
</context>
<response>
Cloud computing revolutionizes modern business operations through its comprehensive suite of capabilities. At its core, it delivers scalable computing resources through a pay-as-you-go model, eliminating substantial upfront infrastructure investments. Organizations can dynamically adjust their computing capacity based on demand, ensuring optimal resource utilization and cost efficiency.
... [Note: Full response would continue with more words]
</response>
</example>

<example index="3">
<query>
Improve the grammar and clarity of this section
</query>
<context>
<reflyArtifact identifier="api-docs" type="document" title="API Documentation">
Authentication is required for all endpoints. <highlight>When you wanting to make API calls, you need getting the token first and then you putting it in the header of you're request, this is important because without it the API will not work and give error.</highlight> See the authentication section for details.
</reflyArtifact>
</context>
<response>
Authentication is required for all endpoints. To make API calls, first obtain an authentication token and include it in your request headers. This step is crucial as requests without valid authentication tokens will result in error responses. See the authentication section for details.
... [Note: Full response would continue with more words]
</response>
</example>`;

export const contextualExamples = `
## Context-Aware Examples

<example index="1">
<context>
<documentContext>
<reflyArtifact identifier="tech-doc" type="document" title="Cloud Computing Overview">
Cloud computing is transforming modern business. <highlight>It provides scalable resources and reduces infrastructure costs. Companies can access computing power on demand.</highlight> Many organizations are adopting cloud solutions.
</reflyArtifact>
</documentContext>

<referenceContext>
<MentionedContext>
<KnowledgeBaseResources>
<ContextItem citationIndex='1' type='resource' title='Cost Analysis'>
Our analysis shows:
- 40% reduction in infrastructure costs
- 60% improvement in resource utilization
- 30% faster deployment cycles
</ContextItem>
</KnowledgeBaseResources>
</MentionedContext>
</referenceContext>
</context>

<query>
Rewrite this section to be more comprehensive with specific benefits
</query>
<response>
Cloud computing is transforming modern business. It delivers elastic scalability and pay-per-use pricing, resulting in a documented 40% reduction in infrastructure costs and 60% improvement in resource utilization. Organizations can access computing power on demand while benefiting from reduced maintenance overhead and global accessibility. Many organizations are adopting cloud solutions.
... [Note: Full response would continue with more words]
</response>
</example>

<example index="2">
<context>
<documentContext>
<reflyArtifact identifier="api-docs" type="document" title="API Documentation">
Authentication is required for all endpoints. <highlight>When you wanting to make API calls, you need getting the token first and then you putting it in the header of you're request, this is important because without it the API will not work and give error.</highlight> See the authentication section for details.
</reflyArtifact>
</documentContext>

<referenceContext>
<MentionedContext>
<KnowledgeBaseDocuments>
<ContextItem citationIndex='2' type='document' title='API Standards'>
Our API security requirements:
- JWT authentication
- 15-minute token expiration
- HTTPS-only endpoints
</ContextItem>
</KnowledgeBaseDocuments>
</MentionedContext>
</referenceContext>
</context>

<query>
Improve the grammar and clarity of this section with security best practices
</query>
<response>
Authentication is required for all endpoints. To make API calls, first obtain a JWT token following secure token storage practices. Include this token in your request headers, ensuring proper implementation of rate limiting. The token expires after 15 minutes as per our security requirements. Requests without valid authentication will receive error responses. See the authentication section for details.
... [Note: Full response would continue with more words]
</response>
</example>

<example index="3">
<context>
<documentContext>
<reflyArtifact identifier="tech-doc" type="document" title="Deployment Process">
Our deployment workflow ensures quality. <highlight>The team reviews code and then deploys it. Testing happens in staging environment.</highlight> This process maintains our standards.
</reflyArtifact>
</documentContext>

<referenceContext>
<MentionedContext>
<UserSelectedContent>
<ContextItem citationIndex='1' type='selectedContent' title='Current Process'>
Current deployment steps:
1. Manual code review
2. Testing in staging
3. Production deployment
</ContextItem>
</UserSelectedContent>
<KnowledgeBaseResources>
<ContextItem citationIndex='2' type='resource' title='CI/CD Guidelines'>
Recommended CI/CD practices:
- Automated testing
- Continuous integration
- Automated deployments
</ContextItem>
</KnowledgeBaseResources>
</MentionedContext>
</referenceContext>
</context>

<query>
Expand this section with more deployment details
</query>
<response>
Our deployment workflow ensures quality. The process begins with a thorough manual code review, followed by automated testing and continuous integration practices. After passing automated tests, the code undergoes comprehensive testing in the staging environment, leveraging automated deployment procedures. This process maintains our standards.
... [Note: Full response would continue with more words]
</response>
</example>`;