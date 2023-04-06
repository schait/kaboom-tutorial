from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def show_homepage():
    """Show the application's homepage."""

    return render_template('index.html')

@app.route('/sidescroller')
def play_sidescroller():
    """Show the application's homepage."""

    return render_template('sidescroller.html')

@app.route('/asteroids')
def play_asteroids():
    """Show the application's homepage."""

    return render_template('asteroids.html')

@app.route('/showscore/<int:score>')
def show_score(score):
    """Show the application's homepage."""

    return render_template('score.html', score=score)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
