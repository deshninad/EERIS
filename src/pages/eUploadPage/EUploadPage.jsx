import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EUploadPage.css";

const EUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [notes, setNotes] = useState("");
  
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    // Preview the file if it's an image
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !expenseType) {
      alert("Please select a file and expense type.");
      return;
    }

    // Simulate an upload process
    console.log("Uploading:", selectedFile.name);
    console.log("Expense Type:", expenseType);
    console.log("Notes:", notes);
    
    alert("File uploaded successfully!");
  };

  return (
    <div className="upload-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <h2>EERIS</h2>
        <div className="nav-links">
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/login")}>Sign Out</button>
        </div>
      </nav>

      <div className="upload-container">
        <h2>E-Upload Page</h2>
        
        {/* File Upload */}
        <input type="file" onChange={handleFileChange} />
        
        {previewUrl && <img src={previewUrl} alt="Preview" className="file-preview" />}

        {/* Expense Type Dropdown */}
        <select value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
          <option value="">Select Expense Type</option>
          <option value="Travel">Travel</option>
          <option value="Food">Food</option>
          <option value="Office Supplies">Office Supplies</option>
          <option value="Other">Other</option>
        </select>

        {/* Notes Input Field */}
        <textarea
          placeholder="Enter any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>

        {/* Upload Button */}
        <button onClick={handleUpload} disabled={!selectedFile || !expenseType}>
          Upload
        </button>
      </div>
    </div>
  );
};

export default EUploadPage;
