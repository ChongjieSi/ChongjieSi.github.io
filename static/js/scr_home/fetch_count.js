fetch('/404/number.txt')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
		const textFile1Element = document.getElementById('text-file1')
		textFile1Element.textContent = lines[0];
		const textFile1Element1 = document.getElementById('text-file2')
		textFile1Element1.textContent = lines[1];

      })
      .catch(error => {
        console.log('Error loading text file:', error);
      });