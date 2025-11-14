import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Editor = ({ name, value, onChange, placeholder }) => {
  const handleEditorChange = (content) => {
    onChange({
      target: {
        name: name,
        value: content,
      },
    });
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={handleEditorChange}
      placeholder={placeholder || "Enter text here..."}
      modules={{
        toolbar: [
          [{ header: '1' }, { header: '2' }, { font: [] }],
          [{ list: 'shipmented' }, { list: 'bullet' }],
          ['bold', 'italic', 'underline'],
          ['image', 'code-block'],
        ],
      }}
    />
  );
};

export default Editor;
