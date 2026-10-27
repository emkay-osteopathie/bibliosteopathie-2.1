/* ── Mini-quiz de révision ──
   Usage : renderQuiz(document.getElementById('monConteneur'), questions, { shuffle: false });
   Chaque question est soit :
     { t: 'mcq',  q: 'Question ?', c: ['choix A', 'choix B', ...], a: 1 (index de la bonne réponse), e: 'Explication' }
     { t: 'open', q: 'Question ?', a: 'Réponse à afficher au clic' }
   Aucun stockage navigateur : le score vit en mémoire et repart à zéro au rechargement. */
(function () {
  function mk(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  window.renderQuiz = function (container, questions, opts) {
    if (!container) return;
    opts = opts || {};
    var qs = opts.shuffle ? shuffled(questions) : questions.slice();
    if (opts.limit && qs.length > opts.limit) qs = qs.slice(0, opts.limit);

    container.innerHTML = '';
    container.classList.add('quiz-wrap');

    var mcqTotal = qs.filter(function (q) { return q.t === 'mcq'; }).length;
    var answered = 0, good = 0;

    var head = mk('div', 'quiz-head');
    head.appendChild(mk('div', 'quiz-title', '<span class="quiz-ico">🎯</span>' + (opts.title || 'Mini-quiz de révision')));
    var tools = mk('div', 'quiz-tools');
    var score = mk('span', 'quiz-score');
    var reset = mk('button', 'quiz-reset', '↻ Recommencer');
    reset.type = 'button';
    reset.addEventListener('click', function () { renderQuiz(container, questions, opts); });
    tools.appendChild(score);
    tools.appendChild(reset);
    head.appendChild(tools);
    container.appendChild(head);

    function updateScore() {
      score.textContent = mcqTotal
        ? 'Score QCM : ' + good + ' / ' + mcqTotal + (answered < mcqTotal ? ' · ' + (mcqTotal - answered) + ' restante(s)' : ' · terminé')
        : '';
      score.style.display = mcqTotal ? '' : 'none';
    }
    updateScore();

    qs.forEach(function (q, idx) {
      var box = mk('div', 'quiz-q');
      box.appendChild(mk('div', 'quiz-q-num', 'Question ' + (idx + 1) + '<span class="quiz-q-tag">' + (q.t === 'mcq' ? 'QCM' : 'Réponse courte') + '</span>'));
      box.appendChild(mk('div', 'quiz-q-text', q.q));

      var fb = mk('div', 'quiz-fb');

      if (q.t === 'mcq') {
        var list = mk('div', 'quiz-choices');
        var btns = [];
        q.c.forEach(function (label, i) {
          var b = mk('button', 'quiz-choice', label);
          b.type = 'button';
          b.addEventListener('click', function () {
            btns.forEach(function (x) { x.disabled = true; });
            var ok = (i === q.a);
            answered++;
            if (ok) good++;
            b.classList.add(ok ? 'is-correct' : 'is-wrong');
            if (!ok) btns[q.a].classList.add('is-correct');
            fb.className = 'quiz-fb show' + (ok ? '' : ' bad');
            fb.innerHTML = (ok ? '<strong>Exact.</strong> ' : '<strong>Pas tout à fait.</strong> Bonne réponse : ' + q.c[q.a] + '. ') + (q.e || '');
            updateScore();
          });
          btns.push(b);
          list.appendChild(b);
        });
        box.appendChild(list);
      } else {
        var rev = mk('button', 'quiz-reveal', 'Voir la réponse');
        rev.type = 'button';
        rev.addEventListener('click', function () {
          var open = fb.classList.toggle('show');
          rev.textContent = open ? 'Masquer la réponse' : 'Voir la réponse';
        });
        fb.className = 'quiz-fb open-answer';
        fb.innerHTML = q.a;
        box.appendChild(rev);
      }

      box.appendChild(fb);
      container.appendChild(box);
    });
  };
})();
