import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, Card, ListGroup, Alert, ProgressBar } from 'react-bootstrap';
import styled from 'styled-components';

const StyledContainer = styled(Container)`
  background-color: #f0f8ff;
  min-height: 100vh;
  padding-top: 2rem;
`;

const StyledCard = styled(Card)`
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const StyledButton = styled(Button)`
  background-color: #4a90e2;
  border-color: #4a90e2;
  &:hover {
    background-color: #3a78c2;
    border-color: #3a78c2;
  }
`;

const StyledHeader = styled.h1`
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 2rem;
`;

const ChatSessionItem = styled(ListGroup.Item)`
  cursor: pointer;
  &:hover {
    background-color: #f8f9fa;
  }
`;

const QuestionItem = styled(ListGroup.Item)`
  cursor: pointer;
  &:hover {
    background-color: #f8f9fa;
  }
`;

const languages = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  te: "Telugu",
  mr: "Marathi",
  ta: "Tamil",
  ur: "Urdu",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  or: "Odia",
  pa: "Punjabi",
  as: "Assamese",
  mai: "Maithili",
  sat: "Santali",
  ks: "Kashmiri",
  ne: "Nepali",
  sd: "Sindhi",
  kok: "Konkani",
  doi: "Dogri",
  mni: "Manipuri",
  brx: "Bodo",
  sa: "Sanskrit",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  ru: "Russian",
  pt: "Portuguese",
  id: "Indonesian",
  ja: "Japanese",
  ko: "Korean",
  tr: "Turkish",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  fi: "Finnish",
  da: "Danish",
  no: "Norwegian",
  el: "Greek",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  uk: "Ukrainian",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  fa: "Persian",
  ms: "Malay"
};

function App() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hoveredQuestionId, setHoveredQuestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:5000/chat_sessions');
      if (Array.isArray(response.data)) {
        setChatSessions(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setChatSessions([]);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      setErrorMessage('Failed to fetch chat sessions: ' + error.message);
      setChatSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestionsForChat = async (chatId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/chat_history/${chatId}`);
      setQuestions(response.data.questions_answers || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setErrorMessage('Failed to fetch questions for the selected chat: ' + error.message);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        setSelectedFile(file);
        setErrorMessage('');
      } else {
        setErrorMessage('File is too large. Please select a file smaller than 10MB.');
        setSelectedFile(null);
      }
    } else {
      setErrorMessage('Please select a valid PDF file.');
      setSelectedFile(null);
    }
  };

  const handleNewChat = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file!');
      return;
    }
    setIsProcessing(true);
    setUploadProgress(0);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://127.0.0.1:5000/new_chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
        timeout: 60000
      });
      setErrorMessage('New chat created successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
      fetchChatSessions();
      setSelectedChatId(response.data.chat_id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      setErrorMessage(`Error creating new chat: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!question) {
      setErrorMessage('Please enter a question!');
      return;
    }
    if (!selectedChatId) {
      setErrorMessage('Please select a chat!');
      return;
    }
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const response = await axios.post('http://127.0.0.1:5000/ask', {
        question,
        language_code: selectedLanguage,
        chat_id: selectedChatId
      });
      setAnswer(response.data.answer);
      fetchChatSessions();
      fetchQuestionsForChat(selectedChatId);
    } catch (error) {
      console.error('Error asking question:', error);
      setErrorMessage('Error asking question: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  return (
    <StyledContainer fluid>
      <Row>
        <Col lg={8}>
          <StyledCard>
            <Card.Body>
              <StyledHeader className="text-center">PDF Chat</StyledHeader>
              
              <Row className="mb-4">
                <Col md={6} className="mb-4 mb-md-0">
                  <StyledCard>
                    <Card.Body>
                      <h5 className="card-title">Start New Chat</h5>
                      <Form.Group className="mb-3">
                        <Form.Control type="file" onChange={handleFileChange} accept=".pdf" />
                      </Form.Group>
                      {selectedFile && (
                        <div className="mb-3">
                          <strong>Selected File:</strong> {selectedFile.name}
                        </div>
                      )}
                      <StyledButton onClick={handleNewChat} disabled={isProcessing || !selectedFile}>
                        Upload PDF
                      </StyledButton>
                      {isProcessing && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} className="mt-2" />}
                    </Card.Body>
                  </StyledCard>
                </Col>
                <Col md={6}>
                  <StyledCard>
                    <Card.Body>
                      <h5 className="card-title">Ask a Question</h5>
                      <Form onSubmit={handleQuestionSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Enter your question..."
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Language:</Form.Label>
                          <Form.Select value={selectedLanguage} onChange={handleLanguageChange}>
                            {Object.entries(languages).map(([code, name]) => (
                              <option key={code} value={code}>{name}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                        <StyledButton type="submit" disabled={isProcessing || !selectedChatId}>
                          Ask
                        </StyledButton>
                      </Form>
                    </Card.Body>
                  </StyledCard>
                </Col>
              </Row>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {answer && (
                <StyledCard>
                  <Card.Body>
                    <h5 className="card-title">Answer</h5>
                    <Card.Text>{answer}</Card.Text>
                  </Card.Body>
                </StyledCard>
              )}
            </Card.Body>
          </StyledCard>
        </Col>
        <Col lg={4}>
          <StyledCard>
            <Card.Body>
              <h5 className="card-title">Chat History</h5>
              {isLoading ? (
                <p>Loading chat history...</p>
              ) : (
                <ListGroup>
                  {chatSessions.map((session) => (
                    <ChatSessionItem
                      key={session._id}
                      active={session._id === selectedChatId}
                      onClick={() => {
                        setSelectedChatId(session._id);
                        fetchQuestionsForChat(session._id);
                      }}
                    >
                      <h6>{session.pdf_title}</h6>
                      <small>{session.questions_answers?.length || 0} questions</small>
                    </ChatSessionItem>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </StyledCard>
        </Col>
      </Row>
      {selectedChatId && (
        <Row>
          <Col lg={8}>
            <StyledCard>
              <Card.Body>
                <h5 className="card-title">Questions</h5>
                <ListGroup>
                  {questions.map((q, index) => (
                    <QuestionItem
                      key={index}
                      onMouseEnter={() => setHoveredQuestionId(index)}
                      onMouseLeave={() => setHoveredQuestionId(null)}
                    >
                      <strong>{q.question}</strong>
                      {hoveredQuestionId === index && (
                        <div style={{ marginTop: '10px', color: '#666' }}>
                          <strong>Answer:</strong> {q.answer}
                        </div>
                      )}
                    </QuestionItem>
                  ))}
                </ListGroup>
              </Card.Body>
            </StyledCard>
          </Col>
        </Row>
      )}
    </StyledContainer>
  );
}

export default App;