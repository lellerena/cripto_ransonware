mkdir -p .\test_directory
cd .\test_directory

# Create some text files
"This is a test document 1" | Out-File -Encoding utf8 "document1.txt"
"This is a test document 2" | Out-File -Encoding utf8 "document2.txt"
"This is a test document 3" | Out-File -Encoding utf8 "document3.txt"

# Create a simple spreadsheet-like CSV
"Name,Age,City`nJohn,25,New York`nMary,30,Los Angeles`nRobert,45,Chicago" | Out-File -Encoding utf8 "contacts.csv"

# Create a simple JSON file
'{"employees":[{"name":"John", "role":"Developer"},{"name":"Mary", "role":"Designer"},{"name":"Robert", "role":"Manager"}]}' | Out-File -Encoding utf8 "data.json"

# Create a simple XML file
'<?xml version="1.0" encoding="UTF-8"?><root><person><name>John</name><age>25</age></person><person><name>Mary</name><age>30</age></person></root>' | Out-File -Encoding utf8 "data.xml"

# Create a subfolder with more files
mkdir -p .\important_docs
"This is a confidential report" | Out-File -Encoding utf8 ".\important_docs\report.txt"
"Financial data for Q1 2025" | Out-File -Encoding utf8 ".\important_docs\financial.txt"

Write-Host "Test files created successfully in .\test_directory"
cd ..
